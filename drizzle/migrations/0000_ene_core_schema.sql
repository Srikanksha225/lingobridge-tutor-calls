-- Roles
create type public.app_role as enum ('researcher', 'admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can see their own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Bootstrap: the first signed-in user to claim it becomes the research administrator.
create or replace function public.claim_first_researcher()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.user_roles where role = 'researcher') then
    return public.has_role(auth.uid(), 'researcher');
  end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'researcher');
  return true;
end $$;
revoke all on function public.claim_first_researcher() from public, anon;
grant execute on function public.claim_first_researcher() to authenticated;

create or replace function public.researcher_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'researcher')
$$;
revoke all on function public.researcher_exists() from public, anon;
grant execute on function public.researcher_exists() to authenticated;

-- Shared updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Learner profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  native_language text,
  level text,
  goal text,
  tutor_id text,
  placement_score integer,
  confidence integer,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Practice sessions
create table public.practice_sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid(),
  tutor_id text not null,
  scenario_id text not null,
  mode text not null default 'voice',
  started_at timestamptz not null,
  duration_sec integer not null default 0,
  learner_turns integer not null default 0,
  corrections integer not null default 0,
  transcript jsonb not null default '[]'::jsonb,
  feedback jsonb not null default '[]'::jsonb,
  recap jsonb,
  analytics jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index practice_sessions_user_idx on public.practice_sessions (user_id, started_at desc);
grant select, insert, update, delete on public.practice_sessions to authenticated;
grant all on public.practice_sessions to service_role;
alter table public.practice_sessions enable row level security;
create policy "Read own sessions" on public.practice_sessions for select to authenticated using (auth.uid() = user_id);
create policy "Insert own sessions" on public.practice_sessions for insert to authenticated with check (auth.uid() = user_id);
create policy "Update own sessions" on public.practice_sessions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own sessions" on public.practice_sessions for delete to authenticated using (auth.uid() = user_id);
create trigger practice_sessions_touch before update on public.practice_sessions for each row execute function public.touch_updated_at();

-- Mistakes
create table public.mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  session_id uuid,
  category text not null,
  original text not null,
  corrected text not null,
  explanation text not null default '',
  created_at timestamptz not null default now()
);
create index mistakes_user_idx on public.mistakes (user_id, created_at desc);
grant select, insert, delete on public.mistakes to authenticated;
grant all on public.mistakes to service_role;
alter table public.mistakes enable row level security;
create policy "Read own mistakes" on public.mistakes for select to authenticated using (auth.uid() = user_id);
create policy "Insert own mistakes" on public.mistakes for insert to authenticated with check (auth.uid() = user_id);
create policy "Delete own mistakes" on public.mistakes for delete to authenticated using (auth.uid() = user_id);

-- Research Lab (separate from learner data; researchers see only their own studies)
create table public.studies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text not null,
  objective text not null default '',
  design text not null default 'between' check (design in ('between', 'within')),
  info_text text not null default '',
  consent_text text not null default '',
  measures jsonb not null default '[]'::jsonb,
  practice_minutes integer not null default 10,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.studies to authenticated;
grant all on public.studies to service_role;
alter table public.studies enable row level security;
create policy "Researchers manage own studies" on public.studies for all to authenticated
  using (auth.uid() = owner_id and public.has_role(auth.uid(), 'researcher'))
  with check (auth.uid() = owner_id and public.has_role(auth.uid(), 'researcher'));
create trigger studies_touch before update on public.studies for each row execute function public.touch_updated_at();

create or replace function public.owns_study(_study_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.studies s
    where s.id = _study_id and s.owner_id = auth.uid() and public.has_role(auth.uid(), 'researcher')
  )
$$;

create table public.study_participants (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  code text not null,
  assigned_condition text check (assigned_condition in ('conventional', 'ai')),
  condition_order text check (condition_order in ('conventional_first', 'ai_first')),
  level text,
  native_language text,
  consented_at timestamptz,
  consent_text_snapshot text,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  unique (study_id, code)
);
grant select, insert, update, delete on public.study_participants to authenticated;
grant all on public.study_participants to service_role;
alter table public.study_participants enable row level security;
create policy "Researchers manage participants" on public.study_participants for all to authenticated
  using (public.owns_study(study_id)) with check (public.owns_study(study_id));

create table public.study_measurements (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  participant_id uuid not null references public.study_participants(id) on delete cascade,
  condition text not null check (condition in ('conventional', 'ai')),
  phase text not null check (phase in ('pre', 'post')),
  task_id text not null,
  metrics jsonb not null default '{}'::jsonb,
  transcript text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.study_measurements to authenticated;
grant all on public.study_measurements to service_role;
alter table public.study_measurements enable row level security;
create policy "Researchers manage measurements" on public.study_measurements for all to authenticated
  using (public.owns_study(study_id)) with check (public.owns_study(study_id));

create table public.study_surveys (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  participant_id uuid not null references public.study_participants(id) on delete cascade,
  condition text not null check (condition in ('conventional', 'ai')),
  phase text not null check (phase in ('pre', 'post')),
  responses jsonb not null default '{}'::jsonb,
  comments text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.study_surveys to authenticated;
grant all on public.study_surveys to service_role;
alter table public.study_surveys enable row level security;
create policy "Researchers manage surveys" on public.study_surveys for all to authenticated
  using (public.owns_study(study_id)) with check (public.owns_study(study_id));

create table public.study_practice_logs (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  participant_id uuid not null references public.study_participants(id) on delete cascade,
  condition text not null check (condition in ('conventional', 'ai')),
  duration_sec integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.study_practice_logs to authenticated;
grant all on public.study_practice_logs to service_role;
alter table public.study_practice_logs enable row level security;
create policy "Researchers manage practice logs" on public.study_practice_logs for all to authenticated
  using (public.owns_study(study_id)) with check (public.owns_study(study_id));