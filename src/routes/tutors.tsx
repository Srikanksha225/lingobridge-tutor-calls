import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Phone } from "lucide-react";

import { AppShell, PageHeading } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/lib/learner-store";
import { TUTOR_PORTRAITS } from "@/lib/tutor-media";
import { TUTORS } from "@/lib/tutors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tutors")({
  head: () => ({
    meta: [
      { title: "Choose your tutor — LingoBridge AI" },
      {
        name: "description",
        content:
          "Meet five AI English tutors, each with their own voice, accent and teaching style.",
      },
      { property: "og:title", content: "Meet the LingoBridge AI tutors" },
      {
        property: "og:description",
        content:
          "Friendly, professional, patient, casual or interview-focused — pick the tutor that suits you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TutorsPage,
});

function TutorsPage() {
  return (
    <AppShell>
      {({ profile }) => (
        <>
          <PageHeading
            eyebrow="Tutors"
            title="Who would you like to talk to?"
            description="Each tutor has a different voice, accent and teaching style. Your default tutor is used for quick sessions from Home."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {TUTORS.map((tutor) => {
              const isDefault = profile.tutorId === tutor.id;
              return (
                <article
                  key={tutor.id}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-xl border bg-card shadow-card",
                    isDefault && "ring-1 ring-teal border-teal",
                  )}
                >
                  <div className="relative aspect-[16/9] bg-muted">
                    <img
                      src={TUTOR_PORTRAITS[tutor.id]}
                      alt={`${tutor.name}, ${tutor.role}`}
                      loading="lazy"
                      width={1280}
                      height={720}
                      className="h-full w-full object-cover"
                    />
                    {isDefault ? (
                      <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
                        <Check className="size-3 text-teal" /> Your tutor
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className="font-display text-2xl">{tutor.name}</h2>
                      <span className="font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">
                        {tutor.accent} accent
                      </span>
                    </div>
                    <p className="text-sm font-medium text-teal">
                      {tutor.role} · {tutor.style}
                    </p>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{tutor.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {tutor.bestFor.map((b) => (
                        <span
                          key={b}
                          className="rounded-full border bg-secondary px-2.5 py-0.5 text-xs"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 flex gap-2 pt-2 md:mt-auto">
                      <Button asChild variant="accent">
                        <Link
                          to="/session/$tutorId"
                          params={{ tutorId: tutor.id }}
                          search={{ scenario: "free" }}
                        >
                          <Phone /> Start a session
                        </Link>
                      </Button>
                      {!isDefault ? (
                        <Button
                          variant="outline"
                          onClick={() => updateProfile({ tutorId: tutor.id })}
                        >
                          Make default
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
