import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Flame, MessageCircle, Phone, Sparkle } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { CategoryLabel } from "@/components/app/CategoryLabel";
import { Button } from "@/components/ui/button";
import { goalName, levelName, nativeName } from "@/lib/languages";
import { practiceStreak, recurringMistakes } from "@/lib/learner-store";
import { getScenario, SCENARIOS } from "@/lib/scenarios";
import { TUTOR_PORTRAITS } from "@/lib/tutor-media";
import { getTutor } from "@/lib/tutors";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — ENE" },
      {
        name: "description",
        content:
          "Pick up where you left off: start a conversation, review recurring mistakes and see suggested practice.",
      },
      { property: "og:title", content: "Your ENE home" },
      {
        property: "og:description",
        content: "Your personal English speaking plan, tutor and progress in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function HomePage() {
  return (
    <AppShell>
      {({ profile, sessions, mistakes }) => {
        const tutor = getTutor(profile.tutorId)!;
        const recurring = recurringMistakes(mistakes, 3);
        const streak = practiceStreak(sessions);
        const minutes = Math.round(sessions.reduce((s, x) => s + x.durationSec, 0) / 60);
        const suggestions = suggestScenarios(profile.goal, profile.level).slice(0, 3);
        const last = sessions[0];

        return (
          <div className="space-y-10">
            <div className="animate-rise">
              <p className="eyebrow mb-3">
                {levelName(profile.level)} · Explanations in {nativeName(profile.nativeLanguage)}
              </p>
              <h1 className="font-display text-3xl font-medium tracking-tight md:text-[2.5rem]">
                {greeting()}
                {profile.name ? `, ${profile.name}` : ""}.
              </h1>
              <p className="mt-2 text-muted-foreground">Focus: {goalName(profile.goal)}</p>
            </div>

            {/* Primary card */}
            <section className="grid overflow-hidden rounded-2xl border bg-card shadow-card md:grid-cols-[1.1fr_1fr]">
              <div className="relative aspect-[16/10] bg-stage md:aspect-auto">
                <img
                  src={TUTOR_PORTRAITS[tutor.id]}
                  alt={`${tutor.name}, your tutor`}
                  width={1280}
                  height={720}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-stage/70 px-3 py-1 text-xs text-stage-foreground backdrop-blur">
                  {tutor.name} · {tutor.role}
                </span>
              </div>
              <div className="flex flex-col justify-center p-8 md:p-10">
                <p className="eyebrow mb-3">Today's conversation</p>
                <h2 className="font-display text-2xl leading-snug md:text-3xl">
                  {recurring[0]
                    ? `Chat with ${tutor.name} and practise your ${recurring[0].category === "fluency" ? "natural phrasing" : "tricky grammar"}.`
                    : `Have a relaxed conversation with ${tutor.name}.`}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {recurring.length
                    ? `${tutor.name} will create natural chances to practise what you've been finding hard.`
                    : "Just talk. Corrections appear beside the call, explained in your language."}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild size="xl" variant="accent">
                    <Link
                      to="/session/$tutorId"
                      params={{ tutorId: tutor.id }}
                      search={{ scenario: "free" }}
                    >
                      <Phone /> Start talking
                    </Link>
                  </Button>
                  <Button asChild size="xl" variant="ghost">
                    <Link to="/tutors">Change tutor</Link>
                  </Button>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-3">
              <Stat
                icon={Flame}
                label="Day streak"
                value={streak}
                hint={streak ? "Keep it going" : "Talk today to start one"}
              />
              <Stat
                icon={Clock}
                label="Minutes spoken"
                value={minutes}
                hint={`${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
              />
              <Stat
                icon={MessageCircle}
                label="Corrections learned"
                value={mistakes.length}
                hint="Every one saved for review"
              />
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              {/* Suggested practice */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Suggested for you</h2>
                  <Link
                    to="/practice"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    All scenarios →
                  </Link>
                </div>
                <div className="grid gap-3">
                  {suggestions.map((s) => {
                    const st = getTutor(s.suggestedTutor)!;
                    return (
                      <Link
                        key={s.id}
                        to="/session/$tutorId"
                        params={{ tutorId: st.id }}
                        search={{ scenario: s.id }}
                        className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-card"
                      >
                        <img
                          src={TUTOR_PORTRAITS[st.id]}
                          alt=""
                          className="size-12 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{s.title}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {s.description} · with {st.name}
                          </p>
                        </div>
                        <span className="hidden font-mono text-xs text-muted-foreground sm:block">
                          {s.minutes} min
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Memory */}
              <section className="rounded-xl border bg-card p-6">
                <div className="mb-1 flex items-center gap-2">
                  <Sparkle className="size-4 text-teal" />
                  <h2 className="text-lg font-semibold">What {tutor.name} remembers</h2>
                </div>
                <p className="mb-5 text-sm text-muted-foreground">
                  Patterns from your past conversations.
                </p>
                {recurring.length ? (
                  <ul className="space-y-4">
                    {recurring.map((r) => (
                      <li key={r.category} className="border-t pt-4 first:border-t-0 first:pt-0">
                        <div className="flex items-center justify-between">
                          <CategoryLabel category={r.category} />
                          <span className="font-mono text-xs text-muted-foreground">
                            ×{r.count}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground line-through">
                          {r.latest.original}
                        </p>
                        <p className="text-sm font-medium">{r.latest.corrected}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                    Nothing yet. After a couple of conversations, mistakes you repeat will show up
                    here — and your tutor will help you practise them.
                  </div>
                )}
                {last ? (
                  <Link
                    to="/progress"
                    className="mt-6 block border-t pt-4 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Last session: {getScenario(last.scenarioId).title} with{" "}
                    {getTutor(last.tutorId)?.name} →
                  </Link>
                ) : null}
              </section>
            </div>
          </div>
        );
      }}
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-3 font-display text-4xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function suggestScenarios(goal: string, level: string) {
  const byGoal: Record<string, string[]> = {
    everyday: ["cafe", "introduce", "directions", "doctor"],
    workplace: ["standup", "phone", "introduce"],
    interviews: ["interview", "introduce", "phone"],
    travel: ["directions", "cafe", "doctor"],
    confidence: ["introduce", "cafe", "free"],
    exams: ["introduce", "doctor", "interview"],
  };
  const ids = byGoal[goal] ?? ["introduce", "cafe", "free"];
  const ordered = ids.map((id) => SCENARIOS.find((s) => s.id === id)!).filter(Boolean);
  if (level === "beginner")
    ordered.sort((a, b) => Number(b.level === "Beginner") - Number(a.level === "Beginner"));
  return ordered;
}
