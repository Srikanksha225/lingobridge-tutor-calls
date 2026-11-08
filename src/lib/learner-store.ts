import { useSyncExternalStore } from "react";

import type { MistakeCategory, SessionRecap, TurnFeedback } from "./feedback-schema";
import type { GoalId, LevelId, NativeLanguageId } from "./languages";
import type { ScenarioId } from "./scenarios";
import type { TutorId } from "./tutors";

/**
 * Learner data lives in this browser (localStorage) for now. Everything goes through this
 * module so it can be swapped for a server-backed store without touching pages.
 */

export type LearnerProfile = {
  name: string;
  nativeLanguage: NativeLanguageId;
  targetLanguage: "english";
  level: LevelId;
  goal: GoalId;
  tutorId: TutorId;
  placementScore: number;
  confidence: number;
  createdAt: string;
};

export type MistakeRecord = {
  id: string;
  category: MistakeCategory;
  original: string;
  corrected: string;
  explanation: string;
  at: string;
  sessionId: string | null;
};

export type TranscriptTurn = { role: "learner" | "tutor"; text: string };

export type SessionRecord = {
  id: string;
  tutorId: TutorId;
  scenarioId: ScenarioId;
  startedAt: string;
  durationSec: number;
  learnerTurns: number;
  corrections: number;
  transcript: TranscriptTurn[];
  feedback: Array<{ text: string; feedback: TurnFeedback }>;
  recap: SessionRecap | null;
};

export type LearnerState = {
  profile: LearnerProfile | null;
  mistakes: MistakeRecord[];
  sessions: SessionRecord[];
};

const KEY = "lingobridge:v1";
const EMPTY: LearnerState = { profile: null, mistakes: [], sessions: [] };
const MAX_MISTAKES = 300;
const MAX_SESSIONS = 50;

let cache: LearnerState | null = null;
const listeners = new Set<() => void>();

function read(): LearnerState {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LearnerState>) : {};
    cache = {
      profile: parsed.profile ?? null,
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: LearnerState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns `null` during SSR / before hydration so pages can render a neutral loading state. */
export function useLearner(): LearnerState | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function saveProfile(profile: LearnerProfile) {
  write({ ...read(), profile });
}

export function updateProfile(patch: Partial<LearnerProfile>) {
  const state = read();
  if (!state.profile) return;
  write({ ...state, profile: { ...state.profile, ...patch } });
}

export function recordMistakes(items: Omit<MistakeRecord, "id" | "at">[]) {
  if (!items.length) return;
  const state = read();
  const now = new Date().toISOString();
  const added = items.map((m) => ({ ...m, id: crypto.randomUUID(), at: now }));
  write({ ...state, mistakes: [...added, ...state.mistakes].slice(0, MAX_MISTAKES) });
}

export function saveSession(session: SessionRecord) {
  const state = read();
  const others = state.sessions.filter((s) => s.id !== session.id);
  write({ ...state, sessions: [session, ...others].slice(0, MAX_SESSIONS) });
}

export function resetLearner() {
  write(EMPTY);
}

/* ---------- Derived insights (pure, unit-tested) ---------- */

export type RecurringMistake = { category: MistakeCategory; count: number; latest: MistakeRecord };

/** A category counts as "recurring" once it has appeared at least this many times. */
export const RECURRING_THRESHOLD = 2;

export function recurringMistakes(mistakes: MistakeRecord[], limit = 5): RecurringMistake[] {
  const by = new Map<MistakeCategory, RecurringMistake>();
  for (const m of mistakes) {
    const entry = by.get(m.category);
    if (entry) {
      entry.count++;
      if (m.at > entry.latest.at) entry.latest = m;
    } else by.set(m.category, { category: m.category, count: 1, latest: m });
  }
  return [...by.values()]
    .filter((e) => e.count >= RECURRING_THRESHOLD)
    .sort((a, b) => b.count - a.count || (a.latest.at < b.latest.at ? 1 : -1))
    .slice(0, limit);
}

/** Consecutive calendar days (local time) with at least one session, ending today or yesterday. */
export function practiceStreak(
  sessions: Pick<SessionRecord, "startedAt">[],
  now = new Date(),
): number {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.startedAt))));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Placement: score out of the number of questions → level. */
export function levelFromPlacement(correct: number, total: number): LevelId {
  if (total <= 0) return "beginner";
  const ratio = correct / total;
  if (ratio >= 0.8) return "advanced";
  if (ratio >= 0.4) return "intermediate";
  return "beginner";
}
