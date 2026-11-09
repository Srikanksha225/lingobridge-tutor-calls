import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  AudioLines,
  BookOpenCheck,
  Brain,
  Captions,
  Check,
  Languages,
  Mic,
  ShieldCheck,
} from "lucide-react";

import { LogoMark, Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useLearner } from "@/lib/learner-store";
import { TUTOR_PORTRAITS } from "@/lib/tutor-media";
import { TUTORS } from "@/lib/tutors";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ENE — Speak English naturally with a friendly AI tutor" },
      {
        name: "description",
        content:
          "Have real voice conversations with an AI English tutor. Mistakes are explained in Telugu, Tamil, Hindi and more, and your tutor remembers what to work on.",
      },
      { property: "og:title", content: "ENE — Speak naturally. Learn confidently." },
      {
        property: "og:description",
        content:
          "Real conversations with an AI English tutor, with corrections explained in your own language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const learner = useLearner();
  const hasProfile = Boolean(learner?.profile);
  const primary = hasProfile
    ? ({ to: "/home", label: "Continue learning" } as const)
    : ({ to: "/onboarding", label: "Start speaking — it's free" } as const);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
          <a href="#tutors" className="hover:text-foreground">
            Tutors
          </a>
          <a href="#memory" className="hover:text-foreground">
            Your progress
          </a>
        </nav>
        <Button asChild size="sm" variant={hasProfile ? "default" : "outline"}>
          <Link to={primary.to}>{hasProfile ? "Open app" : "Get started"}</Link>
        </Button>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1.05fr_1fr] md:pt-16">
        <div className="animate-rise">
          <p className="eyebrow mb-5 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-teal" /> Your personal English speaking coach
          </p>
          <h1 className="font-display text-[2.75rem] font-medium leading-[1.05] tracking-tight text-balance-pretty md:text-[4rem]">
            Speak naturally.
            <br />
            <span className="text-teal">Learn confidently.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Talk out loud with a patient AI tutor about real life — ordering coffee, a team meeting,
            a job interview. Every mistake is explained in your own language, and your tutor
            remembers what to practise next time.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="xl">
              <Link to={primary.to}>
                {primary.label} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="xl" variant="ghost">
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="size-4 text-teal" /> No account needed to start
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-4 text-teal" /> Explanations in 7 Indian languages
            </span>
          </div>
        </div>

        <HeroCall />
      </section>

      {/* Languages strip */}
      <section className="border-y bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-6">
          <p className="eyebrow">Mistakes explained in</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 font-display text-xl text-foreground/80">
            <span>తెలుగు</span>
            <span>தமிழ்</span>
            <span>हिन्दी</span>
            <span>ಕನ್ನಡ</span>
            <span>മലയാളം</span>
            <span>বাংলা</span>
            <span className="font-sans text-base">English</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="font-display text-4xl font-medium tracking-tight">
            Less studying about English. More speaking it.
          </h2>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
          {[
            {
              icon: Mic,
              title: "Talk out loud",
              body: "Press start and have a real voice conversation. Your tutor listens, responds naturally and keeps you talking.",
            },
            {
              icon: Languages,
              title: "Understand every mistake",
              body: "Corrections appear beside the call with a short explanation in your native language and a more natural way to say it.",
            },
            {
              icon: Brain,
              title: "Improve where it matters",
              body: "Recurring mistakes are remembered and woven into your next conversation, so practice targets your real weak spots.",
            },
          ].map((step, i) => (
            <div key={step.title} className="bg-card p-8">
              <div className="mb-8 flex items-center justify-between">
                <step.icon className="size-5 text-teal" />
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Native explanation feature */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Native-language coaching</p>
            <h2 className="font-display text-4xl font-medium tracking-tight">
              Grammar finally makes sense when it's explained in your language.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Most apps explain English in English — which is exactly what you're still learning.
              ENE explains the "why" in Telugu, Tamil, Hindi, Kannada, Malayalam or Bengali,
              then shows you how a fluent speaker would say it.
            </p>
            <ul className="mt-8 space-y-3 text-[0.95rem]">
              {[
                "Grammar, word choice and natural phrasing",
                "Only the mistakes that matter — no red-pen overload",
                "A better way to say it, every time",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-teal" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <FeedbackSample
              said="Yesterday I am going to office."
              fix="Yesterday I went to the office."
              lang="Telugu"
              explanation="'Yesterday' (నిన్న) గతాన్ని సూచిస్తుంది, కాబట్టి 'am going' బదులు past tense 'went' వాడాలి."
              category="Verb tenses"
            />
            <FeedbackSample
              said="She don't like coffee."
              fix="She doesn't like coffee."
              lang="Hindi"
              explanation="'She' के साथ 'does not' यानी 'doesn't' आता है, 'don't' नहीं।"
              category="Subject–verb agreement"
              offset
            />
          </div>
        </div>
      </section>

      {/* Tutors */}
      <section id="tutors" className="mx-auto max-w-6xl px-5 py-24">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Choose your tutor</p>
            <h2 className="font-display text-4xl font-medium tracking-tight">
              Five tutors. Five ways to practise.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Each tutor has their own voice, accent and teaching style. Switch any time.
            </p>
          </div>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {TUTORS.map((tutor) => (
            <article
              key={tutor.id}
              className="group overflow-hidden rounded-xl border bg-card shadow-card"
            >
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                <img
                  src={TUTOR_PORTRAITS[tutor.id]}
                  alt={`${tutor.name}, ${tutor.role}`}
                  loading="lazy"
                  width={1280}
                  height={720}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-4">
                <p className="font-semibold">{tutor.name}</p>
                <p className="text-sm text-muted-foreground">{tutor.role}</p>
                <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">
                  {tutor.accent} accent
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Memory */}
      <section id="memory" className="border-t bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 md:grid-cols-3">
          <div className="md:col-span-1">
            <p className="eyebrow mb-3">Built to remember</p>
            <h2 className="font-display text-4xl font-medium tracking-tight">
              A coach that knows you.
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 md:col-span-2">
            {[
              {
                icon: Brain,
                title: "Learner memory",
                body: "Recurring mistakes are tracked and gently revisited in future sessions.",
              },
              {
                icon: Captions,
                title: "Live captions",
                body: "Follow every word with synchronized captions you can show or hide.",
              },
              {
                icon: BookOpenCheck,
                title: "Session recaps",
                body: "Pronunciation notes, vocabulary to review and targeted prompts after every call.",
              },
              {
                icon: AudioLines,
                title: "Adaptive difficulty",
                body: "Pace and vocabulary adjust to your level, from first words to fluent interviews.",
              },
            ].map((f) => (
              <div key={f.title}>
                <f.icon className="mb-4 size-5 text-teal" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="relative overflow-hidden rounded-2xl bg-stage px-8 py-16 text-stage-foreground md:px-16">
          <div className="max-w-xl">
            <h2 className="font-display text-4xl font-medium tracking-tight">
              Your first conversation takes two minutes to set up.
            </h2>
            <p className="mt-4 text-lg text-stage-foreground/70">
              Pick your language, take a quick level check, choose a tutor — and start talking.
            </p>
            <Button asChild size="xl" variant="accent" className="mt-8">
              <Link to={primary.to}>
                {primary.label} <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-6" />
            <span>ENE — Speak naturally. Learn confidently.</span>
          </div>
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> Your practice history stays in this browser.
          </p>
        </div>
      </footer>
    </div>
  );
}

function HeroCall() {
  return (
    <div className="relative animate-rise [animation-delay:120ms]">
      <div className="overflow-hidden rounded-2xl border bg-stage shadow-lift">
        <div className="relative aspect-[4/3.4]">
          <img
            src={TUTOR_PORTRAITS.maya}
            alt="Maya, a friendly ENE tutor, in a video-call style frame"
            width={1280}
            height={720}
            className="h-full w-full object-cover"
          />
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-stage/70 px-3 py-1.5 text-xs text-stage-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-success animate-soft-pulse" />
            Maya · Friendly tutor
          </div>
          <div className="absolute inset-x-4 bottom-4 rounded-lg bg-stage/75 px-4 py-3 text-[0.95rem] leading-snug text-stage-foreground backdrop-blur">
            <span className="mr-2 font-mono text-[0.65rem] uppercase tracking-wider text-stage-foreground/60">
              Maya
            </span>
            Nice! So you{" "}
            <span className="underline decoration-teal decoration-2 underline-offset-4">
              went to the office
            </span>{" "}
            yesterday — how was it?
          </div>
        </div>
      </div>
      <div className="absolute -bottom-8 -left-4 hidden w-72 rounded-xl border bg-card p-4 shadow-lift md:block">
        <p className="eyebrow mb-2">Correction · Telugu</p>
        <p className="text-sm text-muted-foreground line-through">I am going to office yesterday</p>
        <p className="text-sm font-medium">I went to the office yesterday</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          నిన్న జరిగిన పనికి past tense 'went' వాడండి.
        </p>
      </div>
    </div>
  );
}

function FeedbackSample(props: {
  said: string;
  fix: string;
  lang: string;
  explanation: string;
  category: string;
  offset?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-5 shadow-card ${props.offset ? "md:ml-10" : "md:mr-10"}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full border bg-secondary px-2 py-0.5 text-[0.7rem] font-medium">
          {props.category}
        </span>
        <span className="font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">
          Explained in {props.lang}
        </span>
      </div>
      <p className="text-muted-foreground line-through decoration-destructive/50">{props.said}</p>
      <p className="mt-1 font-medium">{props.fix}</p>
      <p className="mt-3 border-t pt-3 leading-relaxed text-foreground/80">{props.explanation}</p>
    </div>
  );
}
