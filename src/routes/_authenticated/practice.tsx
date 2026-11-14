import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, PenLine } from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeading } from "@/components/app/AppShell";
import { FeedbackCard } from "@/components/app/FeedbackCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TurnFeedback } from "@/lib/feedback-schema";
import { getTurnFeedback } from "@/lib/feedback.functions";
import { nativeName } from "@/lib/languages";
import { recordMistakes, type LearnerProfile } from "@/lib/learner-store";
import { SCENARIOS } from "@/lib/scenarios";
import { TUTOR_PORTRAITS } from "@/lib/tutor-media";
import { getTutor } from "@/lib/tutors";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({
    meta: [
      { title: "Practice — ENE" },
      {
        name: "description",
        content:
          "Real-life speaking scenarios and an instant sentence coach that explains mistakes in your language.",
      },
      { property: "og:title", content: "Practise real-life English conversations" },
      {
        property: "og:description",
        content:
          "Role-play cafés, meetings and interviews with an AI tutor, or check any sentence instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  return (
    <AppShell>
      {({ profile }) => (
        <>
          <PageHeading
            eyebrow="Practice"
            title="Real situations, real conversations."
            description="Pick a scenario and your tutor will set the scene. Or type a sentence below for instant feedback."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SCENARIOS.map((s) => {
              const tutor = getTutor(s.suggestedTutor)!;
              return (
                <Link
                  key={s.id}
                  to="/session/$tutorId"
                  params={{ tutorId: tutor.id }}
                  search={{ scenario: s.id }}
                  className="group flex flex-col rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">
                      {s.level} · {s.minutes} min
                    </span>
                    <img
                      src={TUTOR_PORTRAITS[tutor.id]}
                      alt={tutor.name}
                      className="size-8 rounded-full object-cover"
                    />
                  </div>
                  <h2 className="mt-6 font-display text-xl leading-tight">{s.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                  <span className="mt-5 flex items-center gap-1.5 text-sm font-medium text-teal">
                    Start with {tutor.name}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>

          <SentenceCoach profile={profile} />
        </>
      )}
    </AppShell>
  );
}

function SentenceCoach({ profile }: { profile: LearnerProfile }) {
  const analyze = useServerFn(getTurnFeedback);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ said: string; feedback: TurnFeedback }>>([]);

  async function submit() {
    const said = text.trim();
    if (!said || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyze({
        data: {
          text: said,
          tutorLine: null,
          nativeLanguage: profile.nativeLanguage,
          level: profile.level,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults((r) => [{ said, feedback: res.data }, ...r]);
      recordMistakes(
        res.data.corrections.map((c) => ({
          category: c.category,
          original: c.original,
          corrected: c.corrected,
          explanation: c.explanation,
          sessionId: null,
        })),
      );
      setText("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="mb-2 flex items-center gap-2 text-teal">
          <PenLine className="size-4" />
          <p className="eyebrow !text-teal">Sentence coach</p>
        </div>
        <h2 className="font-display text-3xl font-medium tracking-tight">
          Not sure if it sounds right?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Type something you want to say. You'll get corrections explained in{" "}
          {nativeName(profile.nativeLanguage)} and a more natural way to say it.
        </p>
        <div className="mt-6 rounded-xl border bg-card p-3 shadow-card focus-within:ring-1 focus-within:ring-ring">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            maxLength={600}
            rows={3}
            placeholder="e.g. Yesterday I am going to market for buy vegetables."
            className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            aria-label="Sentence to check"
          />
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-xs text-muted-foreground">
              Enter to check · Shift+Enter for a new line
            </span>
            <Button onClick={() => void submit()} disabled={!text.trim() || loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              {loading ? "Checking…" : "Check"}
            </Button>
          </div>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-1.5 rounded-full bg-teal animate-soft-pulse" />
              Reading your sentence…
            </div>
          </div>
        ) : null}
        {results.map((r, i) => (
          <FeedbackCard key={`${i}-${r.said}`} said={r.said} feedback={r.feedback} />
        ))}
        {!results.length && !loading ? (
          <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Your feedback will appear here.
          </div>
        ) : null}
      </div>
    </section>
  );
}
