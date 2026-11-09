import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeading } from "@/components/app/AppShell";
import { CategoryLabel } from "@/components/app/CategoryLabel";
import { RecapView } from "@/components/app/RecapView";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/feedback-schema";
import { recurringMistakes, resetLearner, type SessionRecord } from "@/lib/learner-store";
import { getScenario } from "@/lib/scenarios";
import { TUTOR_PORTRAITS } from "@/lib/tutor-media";
import { getTutor } from "@/lib/tutors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — ENE" },
      {
        name: "description",
        content: "Your sessions, recaps and the mistakes you're working on, all in one place.",
      },
      { property: "og:title", content: "Your ENE progress" },
      {
        property: "og:description",
        content: "Session recaps, recurring mistakes and vocabulary to review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <AppShell>
      {({ sessions, mistakes }) => {
        const recurring = recurringMistakes(mistakes, 6);
        const max = Math.max(1, ...recurring.map((r) => r.count));
        return (
          <>
            <PageHeading
              eyebrow="Progress"
              title="How you're improving."
              description="Everything is saved in this browser. Recurring mistakes are shared with your tutor at the start of each session."
            />

            <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr]">
              <section className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold">Recurring mistakes</h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Patterns that showed up more than once.
                </p>
                {recurring.length ? (
                  <ul className="space-y-4">
                    {recurring.map((r) => (
                      <li key={r.category}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span>{CATEGORY_LABELS[r.category]}</span>
                          <span className="font-mono text-xs text-muted-foreground">{r.count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-teal"
                            style={{ width: `${(r.count / max) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                    No patterns yet. Keep talking — they'll appear after a few corrections.
                  </p>
                )}

                {mistakes.length ? (
                  <>
                    <h3 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider">
                      Recent corrections
                    </h3>
                    <ul className="divide-y">
                      {mistakes.slice(0, 12).map((m) => (
                        <li key={m.id} className="py-3">
                          <CategoryLabel category={m.category} />
                          <p className="mt-1.5 text-sm text-muted-foreground line-through">
                            {m.original}
                          </p>
                          <p className="text-sm font-medium">{m.corrected}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>

              <section>
                <h2 className="mb-4 text-lg font-semibold">Sessions</h2>
                {sessions.length ? (
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <SessionRow key={s.id} session={s} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-10 text-center">
                    <p className="font-medium">No sessions yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your first conversation will show up here with a full recap.
                    </p>
                    <Button asChild className="mt-5" variant="accent">
                      <Link to="/practice">Choose a scenario</Link>
                    </Button>
                  </div>
                )}

                <div className="mt-12 border-t pt-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete your profile, sessions and saved corrections from this browser?",
                        )
                      )
                        resetLearner();
                    }}
                  >
                    Reset all learning data
                  </Button>
                </div>
              </section>
            </div>
          </>
        );
      }}
    </AppShell>
  );
}

function SessionRow({ session }: { session: SessionRecord }) {
  const [open, setOpen] = useState(false);
  const tutor = getTutor(session.tutorId);
  const scenario = getScenario(session.scenarioId);
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 p-4 text-left hover:bg-secondary/50"
        aria-expanded={open}
      >
        {tutor ? (
          <img src={TUTOR_PORTRAITS[tutor.id]} alt="" className="size-11 rounded-lg object-cover" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-medium">{scenario.title}</p>
          <p className="text-sm text-muted-foreground">
            {tutor?.name} · {format(new Date(session.startedAt), "d MMM, h:mm a")} ·{" "}
            {Math.max(1, Math.round(session.durationSec / 60))} min · {session.corrections}{" "}
            correction{session.corrections === 1 ? "" : "s"}
          </p>
        </div>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="border-t bg-background p-6">
          {session.recap ? (
            <RecapView recap={session.recap} />
          ) : (
            <p className="text-sm text-muted-foreground">No recap was created for this session.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
