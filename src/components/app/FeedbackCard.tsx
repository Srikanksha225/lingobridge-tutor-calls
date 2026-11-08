import { CheckCircle2, Lightbulb } from "lucide-react";

import type { TurnFeedback } from "@/lib/feedback-schema";
import { cn } from "@/lib/utils";

import { CategoryLabel } from "./CategoryLabel";

export function FeedbackCard({
  said,
  feedback,
  compact = false,
}: {
  said: string;
  feedback: TurnFeedback;
  compact?: boolean;
}) {
  const clean = feedback.corrections.length === 0;
  return (
    <div className={cn("rounded-xl border bg-card animate-rise", compact ? "p-4" : "p-5")}>
      <p className={cn("text-foreground/80", compact ? "text-sm" : "")}>
        <span className="mr-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">You</span>
        "{said}"
      </p>

      {clean ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>{feedback.encouragement}</span>
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {feedback.corrections.map((c, i) => (
            <div key={i} className="border-t pt-3">
              <div className="mb-1.5">
                <CategoryLabel category={c.category} />
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground line-through decoration-destructive/50">{c.original}</span>
                <span className="mx-1.5 text-muted-foreground">→</span>
                <span className="font-medium">{c.corrected}</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">{c.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {feedback.better_version ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-teal-soft px-3 py-2.5 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-teal" />
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-wider text-accent-foreground">More natural</p>
            <p className="text-foreground">{feedback.better_version}</p>
          </div>
        </div>
      ) : null}

      {!clean && feedback.encouragement ? (
        <p className="mt-3 text-sm text-muted-foreground">{feedback.encouragement}</p>
      ) : null}
    </div>
  );
}
