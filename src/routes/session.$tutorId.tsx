import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Captions,
  CaptionsOff,
  Info,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RotateCcw,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { FeedbackCard } from "@/components/app/FeedbackCard";
import { RecapView } from "@/components/app/RecapView";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveVoice, type LiveEvent } from "@/hooks/use-live-voice";
import { useLiveAvatar } from "@/hooks/use-live-avatar";
import type { SessionRecap, TurnFeedback } from "@/lib/feedback-schema";
import { getSessionRecap, getTurnFeedback } from "@/lib/feedback.functions";
import { nativeName } from "@/lib/languages";
import {
  recordMistakes,
  recurringMistakes,
  saveSession,
  useLearner,
  type LearnerProfile,
  type MistakeRecord,
} from "@/lib/learner-store";
import { getScenario, SCENARIO_IDS, type ScenarioId } from "@/lib/scenarios";
import {
  appendCaption,
  completedLearnerRows,
  previousTutorLine,
  type CaptionRow,
} from "@/lib/transcript";
import { TUTOR_PORTRAITS } from "@/lib/tutor-media";
import { getTutor, type Tutor } from "@/lib/tutors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/session/$tutorId")({
  validateSearch: (search: Record<string, unknown>): { scenario: ScenarioId } => ({
    scenario: (SCENARIO_IDS as readonly string[]).includes(String(search["scenario"]))
      ? (search["scenario"] as ScenarioId)
      : "free",
  }),
  loader: ({ params }) => {
    const tutor = getTutor(params.tutorId);
    if (!tutor) throw notFound();
    return { tutorId: tutor.id };
  },
  head: ({ params }) => {
    const tutor = getTutor(params.tutorId);
    const name = tutor?.name ?? "your tutor";
    return {
      meta: [
        { title: `Speaking session with ${name} — ENE` },
        {
          name: "description",
          content: `Have a live English voice conversation with ${name}, with captions and instant feedback.`,
        },
        { property: "og:title", content: `Talk with ${name} on ENE` },
        {
          property: "og:description",
          content: "Live English voice practice with captions and corrections in your language.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SessionPage,
});

type FeedbackItem = {
  rowId: number;
  said: string;
  status: "loading" | "done" | "error";
  feedback?: TurnFeedback;
  error?: string;
};

type Phase = "call" | "recap";

function SessionPage() {
  const { tutorId } = Route.useLoaderData();
  const { scenario: scenarioId } = Route.useSearch();
  const learner = useLearner();
  const navigate = useNavigate();
  const tutor = getTutor(tutorId)!;

  useEffect(() => {
    if (learner && !learner.profile) void navigate({ to: "/onboarding" });
  }, [learner, navigate]);

  if (!learner?.profile) {
    return <div className="min-h-screen bg-stage" aria-busy="true" />;
  }
  return (
    <CallRoom
      key={`${tutorId}-${scenarioId}`}
      tutor={tutor}
      scenarioId={scenarioId}
      profile={learner.profile}
      mistakes={learner.mistakes}
    />
  );
}

function CallRoom({
  tutor,
  scenarioId,
  profile,
  mistakes,
}: {
  tutor: Tutor;
  scenarioId: ScenarioId;
  profile: LearnerProfile;
  mistakes: MistakeRecord[];
}) {
  const scenario = getScenario(scenarioId);
  const analyze = useServerFn(getTurnFeedback);
  const recapFn = useServerFn(getSessionRecap);

  const [phase, setPhase] = useState<Phase>("call");
  const [rows, setRows] = useState<CaptionRow[]>([]);
  const rowsRef = useRef<CaptionRow[]>([]);
  const analyzedRef = useRef<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const feedbackRef = useRef<FeedbackItem[]>([]);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [panel, setPanel] = useState<"feedback" | "transcript">("feedback");
  const [greetingIssue, setGreetingIssue] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const sessionId = useRef(crypto.randomUUID());
  const startedAt = useRef<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const finishing = useRef(false);

  const [recap, setRecap] = useState<SessionRecap | null>(null);
  const [recapError, setRecapError] = useState<string | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);

  const setFeedbackBoth = useCallback((update: (prev: FeedbackItem[]) => FeedbackItem[]) => {
    feedbackRef.current = update(feedbackRef.current);
    setFeedback(feedbackRef.current);
  }, []);

  const analyzeRow = useCallback(
    async (row: CaptionRow) => {
      if (analyzedRef.current.has(row.id)) return;
      analyzedRef.current.add(row.id);
      const said = row.text.trim().slice(0, 1200);
      setFeedbackBoth((prev) => [{ rowId: row.id, said, status: "loading" }, ...prev]);
      try {
        const res = await analyze({
          data: {
            text: said,
            tutorLine: previousTutorLine(rowsRef.current, row.id),
            nativeLanguage: profile.nativeLanguage,
            level: profile.level,
          },
        });
        if (!res.ok) {
          setFeedbackBoth((prev) =>
            prev.map((f) => (f.rowId === row.id ? { ...f, status: "error", error: res.error } : f)),
          );
          return;
        }
        setFeedbackBoth((prev) =>
          prev.map((f) => (f.rowId === row.id ? { ...f, status: "done", feedback: res.data } : f)),
        );
        recordMistakes(
          res.data.corrections.map((c) => ({
            category: c.category,
            original: c.original,
            corrected: c.corrected,
            explanation: c.explanation,
            sessionId: sessionId.current,
          })),
        );
      } catch {
        setFeedbackBoth((prev) =>
          prev.map((f) =>
            f.rowId === row.id ? { ...f, status: "error", error: "Feedback could not load." } : f,
          ),
        );
      }
    },
    [analyze, profile.level, profile.nativeLanguage, setFeedbackBoth],
  );

  const onEvent = useCallback(
    (event: LiveEvent) => {
      const delta = typeof event["delta"] === "string" ? event["delta"] : "";
      if (
        event.type === "session.input_transcript.delta" ||
        event.type === "session.output_transcript.delta"
      ) {
        const role = event.type === "session.input_transcript.delta" ? "learner" : "tutor";
        rowsRef.current = appendCaption(rowsRef.current, role, delta);
        setRows(rowsRef.current);
        if (role === "tutor") {
          for (const row of completedLearnerRows(rowsRef.current)) void analyzeRow(row);
        }
      } else if (event.type === "app.delegation.pending") {
        setThinking(true);
      } else if (event.type === "app.delegation.answered") {
        setThinking(false);
      } else if (event.type === "app.greeting.error") {
        setGreetingIssue(`${tutor.name} didn't start talking. Say hello to begin.`);
      }
    },
    [analyzeRow, tutor.name],
  );

  const voice = useLiveVoice({ onEvent });
  const connected = voice.status === "connected";
  const inCall = voice.status === "connecting" || voice.status === "connected";

  // Elapsed timer while connected.
  useEffect(() => {
    if (!connected) return;
    if (!startedAt.current) startedAt.current = new Date();
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startedAt.current?.getTime() ?? Date.now())) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [connected]);

  const avatar = useLiveAvatar({ tutorId: tutor.id, active: inCall, voiceAudioRef: voice.audioRef });
  const voiceSpeaking = useAudioActivity(voice.audioRef, connected);
  const tutorSpeaking = avatar.state === "live" ? avatar.speaking : voiceSpeaking;
  const camera = useCamera();

  function startCall() {
    setGreetingIssue(null);
    voice.start({
      tutorId: tutor.id,
      scenarioId,
      nativeLanguage: profile.nativeLanguage,
      level: profile.level,
      goal: profile.goal,
      focus: recurringMistakes(mistakes, 3).map((r) => r.category),
    });
  }

  async function finishSession() {
    if (finishing.current) return;
    finishing.current = true;
    voice.stop();
    camera.stop();
    setPhase("recap");
    const all = rowsRef.current;
    for (const row of completedLearnerRows(all, true)) void analyzeRow(row);
    const learnerTurns = all.filter((r) => r.role === "learner" && r.text.trim());
    const base = {
      id: sessionId.current,
      tutorId: tutor.id,
      scenarioId,
      startedAt: (startedAt.current ?? new Date()).toISOString(),
      durationSec: startedAt.current
        ? Math.round((Date.now() - startedAt.current.getTime()) / 1000)
        : 0,
      learnerTurns: learnerTurns.length,
      transcript: all.map((r) => ({ role: r.role, text: r.text.trim() })).filter((r) => r.text),
    };
    if (!learnerTurns.length) return;

    // Give in-flight feedback a moment so the recap can use it.
    await waitFor(() => !feedbackRef.current.some((f) => f.status === "loading"), 6000);
    const done = feedbackRef.current.filter((f) => f.status === "done" && f.feedback);
    const corrections = done.flatMap((f) => f.feedback!.corrections);
    const persist = (r: SessionRecap | null) =>
      saveSession({
        ...base,
        corrections: corrections.length,
        feedback: done.map((f) => ({ text: f.said, feedback: f.feedback! })),
        recap: r,
      });
    persist(null);
    await loadRecap(base.transcript, corrections, persist);
  }

  async function loadRecap(
    transcript: Array<{ role: "learner" | "tutor"; text: string }>,
    corrections: TurnFeedback["corrections"],
    persist: (r: SessionRecap | null) => void,
  ) {
    setRecapLoading(true);
    setRecapError(null);
    try {
      const res = await recapFn({
        data: {
          nativeLanguage: profile.nativeLanguage,
          level: profile.level,
          tutorId: tutor.id,
          scenarioId,
          turns: transcript.slice(-80).map((t) => ({ role: t.role, text: t.text.slice(0, 1500) })),
          corrections: corrections.slice(0, 40).map((c) => ({
            original: c.original.slice(0, 400),
            corrected: c.corrected.slice(0, 400),
            category: c.category,
          })),
        },
      });
      if (res.ok) {
        setRecap(res.data);
        persist(res.data);
      } else setRecapError(res.error);
    } catch {
      setRecapError("The recap could not be created.");
    } finally {
      setRecapLoading(false);
    }
  }

  const retryRecap = () => {
    const transcript = rowsRef.current
      .map((r) => ({ role: r.role, text: r.text.trim() }))
      .filter((r) => r.text);
    const corrections = feedbackRef.current.flatMap((f) => f.feedback?.corrections ?? []);
    void loadRecap(transcript, corrections, (r) =>
      saveSession({
        id: sessionId.current,
        tutorId: tutor.id,
        scenarioId,
        startedAt: (startedAt.current ?? new Date()).toISOString(),
        durationSec: elapsed,
        learnerTurns: transcript.filter((t) => t.role === "learner").length,
        corrections: corrections.length,
        transcript,
        feedback: feedbackRef.current
          .filter((f) => f.feedback)
          .map((f) => ({ text: f.said, feedback: f.feedback! })),
        recap: r,
      }),
    );
  };

  const hasConversation = rows.some((r) => r.role === "learner" && r.text.trim());
  const lastTutor = [...rows].reverse().find((r) => r.role === "tutor");
  const lastRow = rows[rows.length - 1];
  const captionRows = rows.slice(-2);

  if (phase === "recap") {
    return (
      <RecapScreen
        tutor={tutor}
        scenarioTitle={scenario.title}
        elapsed={elapsed}
        hasConversation={hasConversation}
        feedback={feedback}
        recap={recap}
        loading={recapLoading}
        error={recapError}
        onRetry={retryRecap}
        nativeLabel={nativeName(profile.nativeLanguage)}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-stage text-stage-foreground">
      {/* Keep the audio element mounted for the whole call. */}
      <audio ref={voice.audioRef} className="sr-only" aria-hidden />

      <header className="flex items-center gap-4 px-4 py-3 md:px-6">
        <Link
          to="/home"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-stage-foreground/70 hover:bg-stage-foreground/10 hover:text-stage-foreground"
        >
          <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Leave</span>
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{scenario.title}</p>
          <p className="truncate text-xs text-stage-foreground/60">
            with {tutor.name} · {tutor.role}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <StatusPill status={voice.status} />
          {connected || elapsed > 0 ? (
            <span className="font-mono tabular-nums text-stage-foreground/70">
              {formatTime(elapsed)}
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid flex-1 gap-4 px-3 pb-3 md:px-6 lg:grid-cols-[1fr_380px]">
        {/* Stage */}
        <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl bg-stage-foreground/5">
          <TutorStage
            tutor={tutor}
            speaking={tutorSpeaking}
            connected={connected}
            avatar={avatar}
          />

          {/* Pre-call / error overlay */}
          {!inCall ? (
            <div className="absolute inset-0 flex items-center justify-center bg-stage/55 p-6 backdrop-blur-[2px]">
              <div className="max-w-sm text-center">
                <h1 className="font-display text-3xl font-medium">
                  {hasConversation ? "The call ended" : `Ready to talk with ${tutor.name}?`}
                </h1>
                <p className="mt-2 text-sm text-stage-foreground/75">
                  {hasConversation
                    ? "You can reconnect or finish and see your recap."
                    : `${scenario.description} Your browser will ask to use your microphone.`}
                </p>
                {voice.error ? (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg bg-destructive/20 px-3 py-2 text-sm text-stage-foreground"
                  >
                    {voice.error}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button
                    size="xl"
                    variant="accent"
                    onClick={startCall}
                    disabled={voice.status === "stopping"}
                  >
                    {voice.status === "stopping" ? <Loader2 className="animate-spin" /> : <Phone />}
                    {hasConversation || voice.error ? "Start a new call" : "Start call"}
                  </Button>
                  {hasConversation ? (
                    <Button size="xl" variant="secondary" onClick={() => void finishSession()}>
                      Finish & see recap
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {voice.status === "connecting" ? (
            <div className="absolute inset-x-0 top-6 flex justify-center">
              <span className="flex items-center gap-2 rounded-full bg-stage/80 px-4 py-2 text-sm backdrop-blur">
                <Loader2 className="size-4 animate-spin" /> Connecting to {tutor.name}…
              </span>
            </div>
          ) : null}

          {voice.playbackBlocked ? (
            <div className="absolute inset-x-0 top-6 flex justify-center">
              <Button variant="accent" onClick={voice.resumePlayback}>
                <Volume2 /> Tap to hear {tutor.name}
              </Button>
            </div>
          ) : null}

          {/* Self view */}
          <div className="absolute right-3 top-3 aspect-video w-32 overflow-hidden rounded-xl border border-stage-foreground/15 bg-stage shadow-lift sm:w-44">
            {camera.on ? (
              <video
                ref={camera.videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full -scale-x-100 object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-stage-foreground/60">
                <span className="flex size-9 items-center justify-center rounded-full bg-stage-foreground/10 text-sm font-medium text-stage-foreground">
                  {(profile.name || "You").slice(0, 1).toUpperCase()}
                </span>
                <span className="text-[0.65rem]">Camera off</span>
              </div>
            )}
            {voice.muted ? (
              <span className="absolute bottom-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-destructive">
                <MicOff className="size-3" />
              </span>
            ) : null}
          </div>

          {/* Captions */}
          {captionsOn && inCall && captionRows.length ? (
            <div
              className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-1.5 md:inset-x-10 md:bottom-5"
              aria-live="polite"
            >
              {captionRows.map((row) => (
                <p
                  key={row.id}
                  className={cn(
                    "max-w-3xl rounded-lg bg-stage/80 px-4 py-2 text-center text-[0.95rem] leading-snug backdrop-blur md:text-base",
                    row.id !== lastRow?.id && "opacity-60",
                  )}
                >
                  <span className="mr-2 font-mono text-[0.62rem] uppercase tracking-wider text-stage-foreground/60">
                    {row.role === "tutor" ? tutor.name : "You"}
                  </span>
                  {tail(row.text, 180)}
                </p>
              ))}
            </div>
          ) : null}

          {greetingIssue && connected && !lastTutor ? (
            <div className="absolute inset-x-0 bottom-24 flex justify-center">
              <span className="rounded-full bg-stage/80 px-4 py-2 text-sm backdrop-blur">
                {greetingIssue}
              </span>
            </div>
          ) : null}
        </div>

        {/* Side panel */}
        <aside className="flex max-h-[calc(100vh-11rem)] min-h-[320px] flex-col overflow-hidden rounded-2xl bg-card text-card-foreground">
          <div className="flex border-b p-1.5">
            {(["feedback", "transcript"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPanel(key)}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-sm capitalize text-muted-foreground transition-colors",
                  panel === key && "bg-secondary font-medium text-foreground",
                )}
              >
                {key === "feedback"
                  ? `Feedback${feedback.length ? ` (${feedback.length})` : ""}`
                  : "Transcript"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {panel === "feedback" ? (
              <FeedbackPanel
                items={feedback}
                nativeLabel={nativeName(profile.nativeLanguage)}
                thinking={thinking}
                tutorName={tutor.name}
              />
            ) : (
              <TranscriptPanel rows={rows} tutorName={tutor.name} />
            )}
          </div>
          <div className="flex items-start gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Pronunciation scoring isn't connected yet. Your recap includes pronunciation tips based
            on the words you used.
          </div>
        </aside>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2.5 px-4 pb-5 pt-1 sm:gap-3">
        <ControlButton
          label={voice.muted ? "Unmute microphone" : "Mute microphone"}
          active={!voice.muted}
          disabled={!connected}
          onClick={() => voice.setMuted(!voice.muted)}
          icon={voice.muted ? <MicOff /> : <Mic />}
          danger={voice.muted}
        />
        <ControlButton
          label={camera.on ? "Turn camera off" : "Turn camera on"}
          active={camera.on}
          onClick={() => void camera.toggle()}
          icon={camera.on ? <Video /> : <VideoOff />}
          busy={camera.pending}
        />
        <ControlButton
          label={captionsOn ? "Hide captions" : "Show captions"}
          active={captionsOn}
          onClick={() => setCaptionsOn((c) => !c)}
          icon={captionsOn ? <Captions /> : <CaptionsOff />}
        />
        <button
          type="button"
          onClick={() => void finishSession()}
          disabled={!inCall && !hasConversation}
          className="ml-2 flex h-12 items-center gap-2 rounded-full bg-destructive px-5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-40"
          aria-label="End session"
        >
          <PhoneOff className="size-4" /> <span className="hidden sm:inline">End session</span>
        </button>
      </div>
      {camera.error ? (
        <p className="pb-4 text-center text-xs text-stage-foreground/70">{camera.error}</p>
      ) : null}
    </div>
  );
}

/* ---------------- Stage ---------------- */

function TutorStage({
  tutor,
  speaking,
  connected,
  avatar,
}: {
  tutor: Tutor;
  speaking: boolean;
  connected: boolean;
  avatar: ReturnType<typeof useLiveAvatar>;
}) {
  const live = avatar.state === "live";
  const label =
    avatar.state === "live"
      ? { text: "Live video avatar · AI-generated", title: `${tutor.name} is an AI tutor shown as a real-time, lip-synced video.` }
      : avatar.state === "starting"
        ? { text: "Starting live video…", title: "Connecting the tutor's real-time video avatar." }
        : avatar.state === "failed"
          ? { text: "Video unavailable · voice call with photo", title: "The live video avatar couldn't start, so the call continues with voice and the tutor's photo." }
          : avatar.state === "unavailable"
            ? { text: "Voice call · photo shown, live video avatar not connected", title: "This is a voice call with the tutor's photo. A real-time video avatar can be connected later." }
            : null;
  return (
    <div className="relative flex-1">
      <img
        src={TUTOR_PORTRAITS[tutor.id]}
        alt={live ? "" : `${tutor.name}, ${tutor.role}`}
        width={1280}
        height={720}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {avatar.enabled ? (
        <>
          <video
            ref={avatar.videoRef}
            autoPlay
            playsInline
            aria-label={live ? `${tutor.name}, live video avatar` : undefined}
            className={cn(
              "absolute inset-0 h-full w-full bg-stage object-cover transition-opacity duration-500",
              live ? "opacity-100" : "opacity-0",
            )}
          />
          <audio ref={avatar.audioRef} autoPlay className="sr-only" aria-hidden />
        </>
      ) : null}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl ring-inset transition-all duration-200",
          speaking ? "ring-4 ring-teal" : "ring-0",
        )}
      />
      <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
        <span className="flex items-center gap-2 rounded-full bg-stage/75 px-3 py-1.5 text-xs backdrop-blur">
          {connected ? (
            <SpeakingBars active={speaking} />
          ) : (
            <span className="size-1.5 rounded-full bg-stage-foreground/50" />
          )}
          {tutor.name}
          {connected ? (
            <span className="text-stage-foreground/60">{speaking ? "speaking" : "listening"}</span>
          ) : null}
        </span>
        {label ? (
          <span
            className="rounded-full bg-stage/75 px-3 py-1 text-[0.68rem] text-stage-foreground/75 backdrop-blur"
            title={label.title}
          >
            {label.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SpeakingBars({ active }: { active: boolean }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full bg-teal transition-all",
            active ? "animate-soft-pulse" : "h-1",
          )}
          style={
            active ? { height: `${[10, 12, 8][i]}px`, animationDelay: `${i * 140}ms` } : undefined
          }
        />
      ))}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; dot: string }> = {
    idle: { label: "Not connected", dot: "bg-stage-foreground/40" },
    connecting: { label: "Connecting", dot: "bg-warning animate-soft-pulse" },
    connected: { label: "Live", dot: "bg-success" },
    stopping: { label: "Ending", dot: "bg-warning" },
    closed: { label: "Ended", dot: "bg-stage-foreground/40" },
  };
  const s = map[status] ?? map["idle"]!;
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-stage-foreground/10 px-2.5 py-1">
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function ControlButton({
  label,
  icon,
  active,
  onClick,
  disabled,
  danger,
  busy,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex size-12 items-center justify-center rounded-full transition-colors disabled:opacity-40 [&_svg]:size-5",
        danger
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : active
            ? "bg-stage-foreground/15 text-stage-foreground hover:bg-stage-foreground/25"
            : "bg-stage-foreground text-stage hover:bg-stage-foreground/90",
      )}
    >
      {busy ? <Loader2 className="animate-spin" /> : icon}
    </button>
  );
}

/* ---------------- Panels ---------------- */

function FeedbackPanel({
  items,
  nativeLabel,
  thinking,
  tutorName,
}: {
  items: FeedbackItem[];
  nativeLabel: string;
  thinking: boolean;
  tutorName: string;
}) {
  return (
    <div className="space-y-3">
      {thinking ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-1.5 rounded-full bg-teal animate-soft-pulse" /> {tutorName} is
          looking that up…
        </p>
      ) : null}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm leading-relaxed text-muted-foreground">
          As you talk, corrections and more natural ways to say things will appear here — explained
          in {nativeLabel}.
        </div>
      ) : null}
      {items.map((item) =>
        item.status === "done" && item.feedback ? (
          <FeedbackCard key={item.rowId} said={item.said} feedback={item.feedback} compact />
        ) : (
          <div key={item.rowId} className="rounded-xl border p-4">
            <p className="text-sm text-foreground/80">"{item.said}"</p>
            {item.status === "loading" ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{item.error}</p>
            )}
          </div>
        ),
      )}
    </div>
  );
}

function TranscriptPanel({ rows, tutorName }: { rows: CaptionRow[]; tutorName: string }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [rows]);
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        The conversation transcript will appear here.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.id} className={cn("flex flex-col", row.role === "learner" && "items-end")}>
          <span className="mb-1 font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground">
            {row.role === "tutor" ? tutorName : "You"}
          </span>
          <p
            className={cn(
              "max-w-[90%] rounded-xl px-3.5 py-2 text-sm leading-relaxed",
              row.role === "learner" ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            {row.text}
          </p>
        </div>
      ))}
      <div ref={end} />
    </div>
  );
}

/* ---------------- Recap ---------------- */

function RecapScreen({
  tutor,
  scenarioTitle,
  elapsed,
  hasConversation,
  feedback,
  recap,
  loading,
  error,
  onRetry,
  nativeLabel,
}: {
  tutor: Tutor;
  scenarioTitle: string;
  elapsed: number;
  hasConversation: boolean;
  feedback: FeedbackItem[];
  recap: SessionRecap | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  nativeLabel: string;
}) {
  const corrections = feedback.reduce((n, f) => n + (f.feedback?.corrections.length ?? 0), 0);
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-5 py-10 md:py-16">
        <div className="flex items-center gap-4">
          <img src={TUTOR_PORTRAITS[tutor.id]} alt="" className="size-14 rounded-xl object-cover" />
          <div>
            <p className="eyebrow">Session recap</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {scenarioTitle} with {tutor.name} · {formatTime(elapsed)} · {feedback.length} turns
              checked · {corrections} correction{corrections === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-10">
          {!hasConversation ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <p className="font-display text-2xl">We didn't hear any conversation</p>
              <p className="mt-2 text-muted-foreground">
                Make sure your microphone is allowed and unmuted, then try again.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-6" aria-busy="true">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {tutor.name} is writing your recap in{" "}
                {nativeLabel}…
              </p>
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            </div>
          ) : recap ? (
            <RecapView recap={recap} />
          ) : error ? (
            <div className="rounded-xl border bg-card p-8">
              <p className="font-medium">The recap couldn't be created</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button className="mt-5" variant="outline" onClick={onRetry}>
                <RotateCcw /> Try again
              </Button>
            </div>
          ) : null}
        </div>

        {feedback.some((f) => f.feedback && f.feedback.corrections.length) ? (
          <section className="mt-14">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Corrections from this session
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {feedback
                .filter((f) => f.feedback && f.feedback.corrections.length)
                .map((f) => (
                  <FeedbackCard key={f.rowId} said={f.said} feedback={f.feedback!} compact />
                ))}
            </div>
          </section>
        ) : null}

        <div className="mt-14 flex flex-wrap gap-3 border-t pt-8">
          <Button asChild size="lg" variant="accent">
            <Link
              to="/session/$tutorId"
              params={{ tutorId: tutor.id }}
              search={{ scenario: "free" }}
              reloadDocument
            >
              <Phone /> Talk again
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/home">Back to home</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/progress">See all progress</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Hooks & helpers ---------------- */

/** Detects when the tutor's audio is audible, for the speaking indicator. */
function useAudioActivity(audioRef: React.RefObject<HTMLAudioElement | null>, enabled: boolean) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setSpeaking(false);
      return;
    }
    let ctx: AudioContext | undefined;
    let raf = 0;
    let last = false;
    let quietSince = 0;

    const attach = (stream: MediaStream) => {
      try {
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const v of data) sum += ((v - 128) / 128) ** 2;
          const rms = Math.sqrt(sum / data.length);
          const now = performance.now();
          let next = last;
          if (rms > 0.02) {
            next = true;
            quietSince = now;
          } else if (now - quietSince > 350) next = false;
          if (next !== last) {
            last = next;
            setSpeaking(next);
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        /* analyser unsupported: indicator stays idle */
      }
    };

    const poll = setInterval(() => {
      const stream = audioRef.current?.srcObject;
      if (stream instanceof MediaStream && stream.getAudioTracks().length) {
        clearInterval(poll);
        attach(stream);
      }
    }, 250);

    return () => {
      clearInterval(poll);
      cancelAnimationFrame(raf);
      void ctx?.close();
    };
  }, [audioRef, enabled]);
  return speaking;
}

/** Local self-view camera. Video never leaves the device. */
function useCamera() {
  const [on, setOn] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setOn(false);
  }, []);

  const toggle = useCallback(async () => {
    if (stream.current) return stop();
    setPending(true);
    setError(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 360 },
      });
      setOn(true);
    } catch {
      setError("Camera unavailable. Check your browser's camera permission.");
    } finally {
      setPending(false);
    }
  }, [stop]);

  useEffect(() => {
    if (on && videoRef.current && stream.current) videoRef.current.srcObject = stream.current;
  }, [on]);

  useEffect(() => stop, [stop]);

  return { on, pending, error, toggle, stop, videoRef };
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function tail(text: string, max: number) {
  const t = text.trim();
  return t.length > max ? `…${t.slice(-max)}` : t;
}

function waitFor(check: () => boolean, timeoutMs: number) {
  return new Promise<void>((resolve) => {
    const start = Date.now();
    const i = setInterval(() => {
      if (check() || Date.now() - start > timeoutMs) {
        clearInterval(i);
        resolve();
      }
    }, 200);
  });
}
