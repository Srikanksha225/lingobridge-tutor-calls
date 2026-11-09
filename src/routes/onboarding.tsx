import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Lock, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  GOALS,
  LEVELS,
  NATIVE_LANGUAGES,
  TARGET_LANGUAGES,
  type GoalId,
  type LevelId,
  type NativeLanguageId,
} from "@/lib/languages";
import { levelFromPlacement, saveProfile } from "@/lib/learner-store";
import { PLACEMENT_QUESTIONS } from "@/lib/placement";
import { TUTOR_PORTRAITS } from "@/lib/tutor-media";
import { TUTORS, type TutorId } from "@/lib/tutors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started — ENE" },
      {
        name: "description",
        content:
          "Choose your languages, take a two-minute level check and pick your AI English tutor.",
      },
      { property: "og:title", content: "Get started with ENE" },
      {
        property: "og:description",
        content: "Set up your personal AI English speaking coach in two minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["welcome", "native", "target", "placement", "goal", "tutor"] as const;
type Step = (typeof STEPS)[number];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [native, setNative] = useState<NativeLanguageId | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [qIndex, setQIndex] = useState(0);
  const [levelOverride, setLevelOverride] = useState<LevelId | null>(null);
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [name, setName] = useState("");
  const [confidence, setConfidence] = useState(4);
  const [tutorId, setTutorId] = useState<TutorId | null>(null);

  const index = STEPS.indexOf(step);
  const correct = PLACEMENT_QUESTIONS.filter((q, i) => answers[i] === q.answer).length;
  const placedLevel = levelFromPlacement(correct, PLACEMENT_QUESTIONS.length);
  const level = levelOverride ?? placedLevel;
  const placementDone = Object.keys(answers).length === PLACEMENT_QUESTIONS.length;

  const go = (dir: 1 | -1) => setStep(STEPS[Math.min(STEPS.length - 1, Math.max(0, index + dir))]!);

  function finish() {
    if (!native || !goal || !tutorId) return;
    saveProfile({
      name: name.trim().slice(0, 40),
      nativeLanguage: native,
      targetLanguage: "english",
      level,
      goal,
      tutorId,
      placementScore: correct,
      confidence,
      createdAt: new Date().toISOString(),
    });
    void navigate({ to: "/home" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <Logo />
        {step !== "welcome" ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {index} / {STEPS.length - 1}
            </span>
            <div className="flex gap-1">
              {STEPS.slice(1).map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "h-1 w-6 rounded-full bg-border transition-colors",
                    i < index && "bg-teal",
                  )}
                />
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-16 pt-6 md:pt-12">
        <div key={step} className="animate-rise flex-1">
          {step === "welcome" && (
            <div className="pt-6 text-center md:pt-14">
              <div className="mx-auto mb-10 flex w-fit -space-x-3">
                {TUTORS.map((t) => (
                  <img
                    key={t.id}
                    src={TUTOR_PORTRAITS[t.id]}
                    alt=""
                    className="size-14 rounded-full border-[3px] border-background object-cover shadow-card"
                  />
                ))}
              </div>
              <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">
                Welcome to ENE
              </h1>
              <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
                Your personal AI language coach is ready to help you speak confidently.
              </p>
              <Button size="xl" className="mt-10" onClick={() => go(1)}>
                Let's get started <ArrowRight />
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Takes about two minutes. No account needed.
              </p>
            </div>
          )}

          {step === "native" && <NativeStep value={native} onChange={setNative} />}

          {step === "target" && (
            <StepFrame
              title="Which language do you want to learn?"
              hint="English is available now. More languages are on the way."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {TARGET_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    disabled={!lang.available}
                    className={cn(
                      "flex items-center justify-between rounded-lg border bg-card p-4 text-left transition-all",
                      lang.available
                        ? "border-teal ring-1 ring-teal"
                        : "cursor-not-allowed opacity-60",
                    )}
                  >
                    <div>
                      <p className="font-medium">{lang.name}</p>
                      <p className="text-sm text-muted-foreground">{lang.native}</p>
                    </div>
                    {lang.available ? (
                      <Check className="size-4 text-teal" />
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="size-3" /> Coming soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </StepFrame>
          )}

          {step === "placement" && (
            <StepFrame
              title={placementDone ? "Here's where you're starting" : "Quick level check"}
              hint={
                placementDone
                  ? "You can adjust this if it doesn't feel right."
                  : "Five short questions. Guessing is fine — choose \"I'm not sure\" if you don't know."
              }
            >
              {!placementDone ? (
                <PlacementQuestion
                  index={qIndex}
                  onAnswer={(choice) => {
                    setAnswers((a) => ({ ...a, [qIndex]: choice }));
                    if (qIndex < PLACEMENT_QUESTIONS.length - 1) setQIndex(qIndex + 1);
                  }}
                />
              ) : (
                <div className="space-y-6">
                  <div className="rounded-xl border bg-card p-6 shadow-card">
                    <p className="eyebrow">Level check result</p>
                    <p className="mt-2 font-display text-3xl">
                      {LEVELS.find((l) => l.id === placedLevel)?.name}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {correct} of {PLACEMENT_QUESTIONS.length} correct. Your tutor will adapt as
                      you talk.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {LEVELS.map((l) => (
                      <OptionRow
                        key={l.id}
                        selected={level === l.id}
                        onClick={() => setLevelOverride(l.id)}
                        title={`${l.name} · ${l.cefr}`}
                        subtitle={l.blurb}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    onClick={() => {
                      setAnswers({});
                      setQIndex(0);
                      setLevelOverride(null);
                    }}
                  >
                    Retake the level check
                  </button>
                </div>
              )}
            </StepFrame>
          )}

          {step === "goal" && (
            <StepFrame
              title="What do you want to get better at?"
              hint="This shapes your conversations and suggested practice."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <OptionRow
                    key={g.id}
                    selected={goal === g.id}
                    onClick={() => setGoal(g.id)}
                    title={g.name}
                  />
                ))}
              </div>
              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">What should your tutor call you?</span>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your first name (optional)"
                    className="mt-2 h-11 bg-card"
                    maxLength={40}
                  />
                </label>
                <div>
                  <span className="text-sm font-medium">
                    How confident do you feel speaking English?
                  </span>
                  <Slider
                    className="mt-5"
                    min={1}
                    max={10}
                    step={1}
                    value={[confidence]}
                    onValueChange={([v]) => setConfidence(v ?? 4)}
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Very nervous</span>
                    <span className="font-mono">{confidence}/10</span>
                    <span>Very confident</span>
                  </div>
                </div>
              </div>
            </StepFrame>
          )}

          {step === "tutor" && (
            <StepFrame
              title="Choose your tutor"
              hint="Each tutor has a different voice and teaching style. You can switch any time."
            >
              <div className="grid gap-3">
                {TUTORS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTutorId(t.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border bg-card p-3 pr-5 text-left transition-all hover:border-foreground/20",
                      tutorId === t.id && "border-teal ring-1 ring-teal",
                    )}
                  >
                    <img
                      src={TUTOR_PORTRAITS[t.id]}
                      alt=""
                      className="h-16 w-20 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {t.name}{" "}
                        <span className="font-normal text-muted-foreground">· {t.role}</span>
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{t.summary}</p>
                    </div>
                    {tutorId === t.id ? <Check className="size-5 shrink-0 text-teal" /> : null}
                  </button>
                ))}
              </div>
            </StepFrame>
          )}
        </div>

        {step !== "welcome" ? (
          <div className="mt-10 flex items-center justify-between border-t pt-6">
            <Button variant="ghost" onClick={() => go(-1)}>
              <ArrowLeft /> Back
            </Button>
            {step === "tutor" ? (
              <Button size="lg" variant="accent" disabled={!tutorId} onClick={finish}>
                Start learning <ArrowRight />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => go(1)}
                disabled={
                  (step === "native" && !native) ||
                  (step === "placement" && !placementDone) ||
                  (step === "goal" && !goal)
                }
              >
                Continue <ArrowRight />
              </Button>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function StepFrame({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-medium tracking-tight md:text-4xl">{title}</h1>
      {hint ? <p className="mt-2 text-muted-foreground">{hint}</p> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function OptionRow({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border bg-card p-4 text-left transition-all hover:border-foreground/20",
        selected && "border-teal ring-1 ring-teal",
      )}
    >
      <div>
        <p className="font-medium">{title}</p>
        {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border",
          selected && "border-teal bg-teal text-primary-foreground",
        )}
      >
        {selected ? <Check className="size-3" /> : null}
      </span>
    </button>
  );
}

function NativeStep({
  value,
  onChange,
}: {
  value: NativeLanguageId | null;
  onChange: (v: NativeLanguageId) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NATIVE_LANGUAGES;
    return NATIVE_LANGUAGES.filter(
      (l) => l.name.toLowerCase().includes(q) || l.native.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <StepFrame
      title="What is your native language?"
      hint="We'll explain your mistakes in this language."
    >
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search languages"
          className="h-11 bg-card pl-10"
          aria-label="Search languages"
        />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {results.map((lang) => (
          <OptionRow
            key={lang.id}
            selected={value === lang.id}
            onClick={() => onChange(lang.id)}
            title={lang.name}
            subtitle={lang.native}
          />
        ))}
        {results.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No match for "{query}". Choose{" "}
            <button
              type="button"
              className="font-medium text-foreground underline"
              onClick={() => onChange("other")}
            >
              Other
            </button>{" "}
            and we'll explain in simple English.
          </div>
        ) : null}
      </div>
    </StepFrame>
  );
}

function PlacementQuestion({
  index,
  onAnswer,
}: {
  index: number;
  onAnswer: (choice: number) => void;
}) {
  const q = PLACEMENT_QUESTIONS[index]!;
  return (
    <div key={index} className="animate-rise">
      <p className="eyebrow mb-3">
        Question {index + 1} of {PLACEMENT_QUESTIONS.length}
      </p>
      <p className="font-display text-2xl leading-snug md:text-[1.75rem]">{q.prompt}</p>
      <div className="mt-6 grid gap-2.5">
        {q.options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            onClick={() => onAnswer(i)}
            className="rounded-lg border bg-card px-4 py-3.5 text-left transition-all hover:border-teal hover:bg-teal-soft"
          >
            {opt}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onAnswer(-1)}
          className="rounded-lg px-4 py-3 text-left text-sm text-muted-foreground hover:bg-secondary"
        >
          I'm not sure
        </button>
      </div>
    </div>
  );
}
