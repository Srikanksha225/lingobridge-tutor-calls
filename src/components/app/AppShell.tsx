import { Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, Home, MessagesSquare, Users } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLearner, type LearnerState } from "@/lib/learner-store";
import { TUTOR_PORTRAITS } from "@/lib/tutor-media";
import { getTutor } from "@/lib/tutors";

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/practice", label: "Practice", icon: MessagesSquare },
  { to: "/tutors", label: "Tutors", icon: Users },
  { to: "/progress", label: "Progress", icon: BarChart3 },
] as const;

/**
 * Layout for signed-up learner pages. Redirects to onboarding when no profile exists in this
 * browser, and hands the hydrated learner state to its children.
 */
export function AppShell({
  children,
}: {
  children: (state: LearnerState & { profile: NonNullable<LearnerState["profile"]> }) => ReactNode;
}) {
  const learner = useLearner();
  const navigate = useNavigate();

  useEffect(() => {
    if (learner && !learner.profile) void navigate({ to: "/onboarding" });
  }, [learner, navigate]);

  const profile = learner?.profile;
  const tutor = profile ? getTutor(profile.tutorId) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Logo to="/home" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary !text-foreground font-medium" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {profile && tutor ? (
              <Button asChild size="sm" variant="accent">
                <Link
                  to="/session/$tutorId"
                  params={{ tutorId: tutor.id }}
                  search={{ scenario: "free" }}
                >
                  <img
                    src={TUTOR_PORTRAITS[tutor.id]}
                    alt=""
                    className="-ml-1.5 size-5 rounded-full object-cover"
                  />
                  Talk to {tutor.name}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t px-3 py-1.5 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground"
              activeProps={{ className: "bg-secondary !text-foreground font-medium" }}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 md:pt-12">
        {learner?.profile ? children(learner as Parameters<typeof children>[0]) : <ShellSkeleton />}
      </main>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h1 className="font-display text-3xl font-medium tracking-tight md:text-[2.5rem] md:leading-[1.1]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
