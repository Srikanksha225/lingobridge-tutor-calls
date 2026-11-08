import { BookOpen, Info, Mic2, Target, ThumbsUp } from "lucide-react";
import type { ReactNode } from "react";

import type { SessionRecap } from "@/lib/feedback-schema";

export function RecapView({ recap }: { recap: SessionRecap }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-medium tracking-tight">{recap.headline}</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-foreground/80">{recap.summary}</p>
      </div>

      {recap.strengths.length ? (
        <Section icon={<ThumbsUp className="size-4" />} title="What went well">
          <ul className="space-y-2">
            {recap.strengths.map((s, i) => (
              <li key={i} className="flex gap-3 leading-relaxed">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-success" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          icon={<Mic2 className="size-4" />}
          title="Pronunciation notes"
          note="Based on the words you used in the transcript — not an audio score."
        >
          {recap.pronunciation_notes.length ? (
            <div className="divide-y rounded-lg border bg-card">
              {recap.pronunciation_notes.map((p, i) => (
                <div key={i} className="p-4">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-semibold">{p.word}</span>
                    <span className="font-mono text-sm text-teal">/{p.sounds_like}/</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/80">{p.tip}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No pronunciation notes this time.</Empty>
          )}
        </Section>

        <Section icon={<BookOpen className="size-4" />} title="Vocabulary to review">
          {recap.vocabulary.length ? (
            <div className="divide-y rounded-lg border bg-card">
              {recap.vocabulary.map((v, i) => (
                <div key={i} className="p-4">
                  <p className="font-semibold">{v.term}</p>
                  <p className="text-sm text-foreground/80">{v.meaning}</p>
                  <p className="mt-1.5 text-sm italic text-muted-foreground">"{v.example}"</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No new vocabulary this time.</Empty>
          )}
        </Section>
      </div>

      <Section icon={<Target className="size-4" />} title="Practise these next">
        <div className="grid gap-3 md:grid-cols-3">
          {recap.practice_prompts.map((p, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              <p className="mt-2 font-medium leading-snug">{p.prompt}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.why}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, title, note, children }: { icon: ReactNode; title: string; note?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-teal">
        {icon}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      </div>
      {note ? (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3" /> {note}
        </p>
      ) : null}
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{children}</div>;
}
