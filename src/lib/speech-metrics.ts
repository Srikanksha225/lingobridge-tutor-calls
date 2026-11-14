/**
 * Speech analytics computed only from real evidence: microphone voice-activity timing and the
 * learner's own transcript. Pure functions, unit-tested. Pronunciation is never scored here.
 */

export type Segment = { start: number; end: number };

/** Gap thresholds (ms) between two stretches of the learner's own speech. */
export const PAUSE_RULES = {
  /** Shorter gaps are part of normal speech rhythm and are not counted as pauses. */
  minPauseMs: 300,
  /** At or above this a pause counts as a hesitation (normal sentence breaks are shorter). */
  hesitationMs: 1000,
  /** At or above this a pause counts as long. */
  longMs: 2000,
  /** Longer silences are turn-taking or waiting, not a pause inside speech, and are ignored. */
  maxInTurnMs: 6000,
} as const;

/** Conversational pace bands (words per minute) for English learners. */
export const PACE_BANDS = { slowBelow: 100, fastAbove: 160 } as const;

export type PauseStats = {
  count: number;
  normal: number;
  hesitations: number;
  long: number;
  averageMs: number | null;
  longestMs: number | null;
};

export type FillerItem = { word: string; count: number; examples: string[] };

export type SpeechAnalytics = {
  version: 1;
  source: "live-voice" | "recorded-task" | "text";
  sessionMs: number;
  /** Learner speaking time from microphone activity (null when there was no microphone). */
  learnerSpeakingMs: number | null;
  tutorSpeakingMs: number | null;
  wordCount: number;
  wpm: number | null;
  pace: "slow" | "moderate" | "fast" | null;
  pauses: PauseStats | null;
  fillers: { total: number; perHundredWords: number | null; items: FillerItem[] };
  vocabulary: {
    uniqueWords: number;
    typeTokenRatio: number | null;
    mattr: number | null;
    repeated: Array<{ word: string; count: number }>;
  };
  grammar: {
    corrections: number;
    byCategory: Record<string, number>;
    perHundredWords: number | null;
  };
  pronunciation: { available: false; reason: string };
  insights: string[];
};

export const PRONUNCIATION_UNAVAILABLE =
  "Pronunciation is not scored: ENE has no audio-based pronunciation assessment connected, and scores from text alone would be guesses.";

/* ---------------- Words ---------------- */

export function tokenize(text: string): string[] {
  return (text.toLowerCase().normalize("NFC").match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) ?? []).map(
    (w) => w.replace(/’/g, "'"),
  );
}

export function countWords(text: string): number {
  return tokenize(text).length;
}

/** Words per minute over actual speaking time (not total session time). */
export function wordsPerMinute(words: number, speakingMs: number): number | null {
  if (words < 1 || speakingMs < 5000) return null;
  return Math.round((words / (speakingMs / 60000)) * 10) / 10;
}

export function paceLabel(wpm: number | null): SpeechAnalytics["pace"] {
  if (wpm === null) return null;
  if (wpm < PACE_BANDS.slowBelow) return "slow";
  if (wpm > PACE_BANDS.fastAbove) return "fast";
  return "moderate";
}

/* ---------------- Fillers ---------------- */

const HESITATION_SOUNDS = new Set(["um", "umm", "ummm", "uh", "uhh", "uhm", "er", "erm", "hmm", "hm", "ah", "eh"]);
const OBJECT_AFTER_YOU_KNOW =
  /^(what|that|how|why|where|who|when|if|the|a|an|my|your|his|her|him|them|it|this|these|those|me|us|about|anything|something|everything)\b/;

/**
 * Counts filler words. Hesitation sounds always count. "like", "actually", "basically",
 * "you know" and "I mean" count only in filler positions (set off by commas or at the start of a
 * clause followed by a comma), so "I like tea" or "you know the answer" are not counted.
 */
export function findFillers(utterances: string[]): FillerItem[] {
  const found = new Map<string, FillerItem>();
  const add = (word: string, source: string) => {
    const item = found.get(word) ?? { word, count: 0, examples: [] };
    item.count++;
    const example = source.trim().slice(0, 140);
    if (item.examples.length < 3 && !item.examples.includes(example)) item.examples.push(example);
    found.set(word, item);
  };
  for (const raw of utterances) {
    const text = raw.toLowerCase().replace(/’/g, "'");
    for (const token of tokenize(text)) {
      if (HESITATION_SOUNDS.has(token)) add(token.startsWith("u") && token !== "uh" && token !== "uhh" ? "um" : token.replace(/(.)\1+$/, "$1"), raw);
    }
    // Discourse fillers: only when set off as a filler, never as content.
    const clause = String.raw`(?:^|[,.!?;]\s*)`;
    for (const word of ["like", "actually", "basically", "literally"]) {
      const re = new RegExp(`${clause}${word}\\s*,|,\\s*${word}\\s*,`, "g");
      for (const _ of text.matchAll(re)) add(word, raw);
    }
    for (const m of text.matchAll(/\byou know\b(\s*[,.!?]?\s*)(\S*)/g)) {
      const punct = (m[1] ?? "").trim();
      const next = m[2] ?? "";
      if (punct || !next || !OBJECT_AFTER_YOU_KNOW.test(next)) add("you know", raw);
    }
    for (const _ of text.matchAll(new RegExp(`${clause}i mean\\s*,`, "g"))) add("i mean", raw);
  }
  return [...found.values()].sort((a, b) => b.count - a.count);
}

/* ---------------- Vocabulary ---------------- */

const STOPWORDS = new Set(
  "a an the and or but so if then i me my we our you your he him his she her it its they them their is am are was were be been being do does did have has had to of in on at for with from by as that this these those there here what which who whom when where why how not no yes very just can could will would should may might must also too than about into over up down out i'm it's don't i've i'll you're that's".split(
    " ",
  ),
);

export function vocabulary(words: string[]): SpeechAnalytics["vocabulary"] {
  const unique = new Set(words);
  const counts = new Map<string, number>();
  for (const w of words) if (!STOPWORDS.has(w) && w.length > 2) counts.set(w, (counts.get(w) ?? 0) + 1);
  const repeated = [...counts.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));
  return {
    uniqueWords: unique.size,
    typeTokenRatio: words.length >= 10 ? round2(unique.size / words.length) : null,
    mattr: movingTypeTokenRatio(words, 25),
    repeated,
  };
}

/** Moving-average type-token ratio: length-independent vocabulary diversity (needs ≥ window words). */
export function movingTypeTokenRatio(words: string[], window = 25): number | null {
  if (words.length < window) return null;
  let total = 0;
  const steps = words.length - window + 1;
  for (let i = 0; i < steps; i++) total += new Set(words.slice(i, i + window)).size / window;
  return round2(total / steps);
}

/* ---------------- Timing ---------------- */

export function totalMs(segments: Segment[]): number {
  return segments.reduce((sum, s) => sum + Math.max(0, s.end - s.start), 0);
}

/** Merges overlapping or touching segments, sorted by start. */
export function mergeSegments(segments: Segment[], joinGapMs = 0): Segment[] {
  const sorted = segments.filter((s) => s.end > s.start).sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s.start - last.end <= joinGapMs) last.end = Math.max(last.end, s.end);
    else out.push({ ...s });
  }
  return out;
}

/** Removes the parts of `segments` that overlap `remove` (e.g. tutor audio echoing into the mic). */
export function subtractSegments(segments: Segment[], remove: Segment[]): Segment[] {
  const cut = mergeSegments(remove);
  const out: Segment[] = [];
  for (const s of mergeSegments(segments)) {
    let pieces: Segment[] = [{ ...s }];
    for (const r of cut) {
      pieces = pieces.flatMap((p) => {
        if (r.end <= p.start || r.start >= p.end) return [p];
        const parts: Segment[] = [];
        if (r.start > p.start) parts.push({ start: p.start, end: r.start });
        if (r.end < p.end) parts.push({ start: r.end, end: p.end });
        return parts;
      });
    }
    out.push(...pieces);
  }
  return out.filter((p) => p.end - p.start >= 1);
}

/**
 * Pauses inside the learner's speech: gaps between their speech segments that are not
 * interrupted by the tutor talking and are short enough to be within one turn.
 */
export function pauseStats(learner: Segment[], tutor: Segment[] = []): PauseStats {
  const speech = mergeSegments(learner);
  const tutorMerged = mergeSegments(tutor);
  const gaps: number[] = [];
  for (let i = 1; i < speech.length; i++) {
    const start = speech[i - 1]!.end;
    const end = speech[i]!.start;
    const gap = end - start;
    if (gap < PAUSE_RULES.minPauseMs || gap > PAUSE_RULES.maxInTurnMs) continue;
    if (tutorMerged.some((t) => t.start < end && t.end > start)) continue;
    gaps.push(gap);
  }
  const hesitations = gaps.filter((g) => g >= PAUSE_RULES.hesitationMs).length;
  const long = gaps.filter((g) => g >= PAUSE_RULES.longMs).length;
  return {
    count: gaps.length,
    normal: gaps.length - hesitations,
    hesitations,
    long,
    averageMs: gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null,
    longestMs: gaps.length ? Math.max(...gaps) : null,
  };
}

/* ---------------- Assembly ---------------- */

export function analyzeSpeech(input: {
  source: SpeechAnalytics["source"];
  sessionMs: number;
  utterances: string[];
  learnerSegments: Segment[] | null;
  tutorSegments?: Segment[] | null;
  corrections?: Array<{ category: string }>;
  previous?: Pick<SpeechAnalytics, "wpm" | "fillers" | "grammar" | "wordCount"> | null;
}): SpeechAnalytics {
  const words = input.utterances.flatMap(tokenize);
  const tutor = input.tutorSegments ?? [];
  const learner = input.learnerSegments ? subtractSegments(input.learnerSegments, tutor) : null;
  const learnerSpeakingMs = learner ? totalMs(learner) : null;
  const wpm = learnerSpeakingMs === null ? null : wordsPerMinute(words.length, learnerSpeakingMs);
  const fillerItems = findFillers(input.utterances);
  const fillerTotal = fillerItems.reduce((n, f) => n + f.count, 0);
  const byCategory: Record<string, number> = {};
  for (const c of input.corrections ?? []) byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
  const corrections = input.corrections?.length ?? 0;
  const result: SpeechAnalytics = {
    version: 1,
    source: input.source,
    sessionMs: Math.round(input.sessionMs),
    learnerSpeakingMs: learnerSpeakingMs === null ? null : Math.round(learnerSpeakingMs),
    tutorSpeakingMs: input.tutorSegments ? Math.round(totalMs(mergeSegments(tutor))) : null,
    wordCount: words.length,
    wpm,
    pace: paceLabel(wpm),
    pauses: learner ? pauseStats(learner, tutor) : null,
    fillers: {
      total: fillerTotal,
      perHundredWords: words.length >= 20 ? round1((fillerTotal / words.length) * 100) : null,
      items: fillerItems,
    },
    vocabulary: vocabulary(words),
    grammar: {
      corrections,
      byCategory,
      perHundredWords: words.length >= 20 ? round1((corrections / words.length) * 100) : null,
    },
    pronunciation: { available: false, reason: PRONUNCIATION_UNAVAILABLE },
    insights: [],
  };
  result.insights = buildInsights(result, input.previous ?? null);
  return result;
}

/** Every insight is tied to a measured value; nothing is shown without evidence. */
export function buildInsights(
  a: SpeechAnalytics,
  previous: Pick<SpeechAnalytics, "wpm" | "fillers" | "grammar" | "wordCount"> | null,
): string[] {
  const out: string[] = [];
  if (a.wordCount < 15) {
    out.push(`You said ${a.wordCount} word${a.wordCount === 1 ? "" : "s"} — speak a little more next time so ENE can measure your pace and vocabulary.`);
    return out;
  }
  if (a.pace === "fast" && a.wpm !== null)
    out.push(`You spoke at about ${Math.round(a.wpm)} words per minute, which is fast for a conversation. Try slowing down slightly so each word is clear.`);
  if (a.pace === "slow" && a.wpm !== null)
    out.push(`You spoke at about ${Math.round(a.wpm)} words per minute. That's a careful pace — as you get comfortable, try linking phrases together without stopping.`);
  if (a.pace === "moderate" && a.wpm !== null)
    out.push(`Your pace (about ${Math.round(a.wpm)} words per minute) is comfortable for conversation.`);
  if (a.fillers.perHundredWords !== null && a.fillers.perHundredWords >= 3 && a.fillers.items[0])
    out.push(`You used filler words ${a.fillers.total} times (most often "${a.fillers.items[0].word}", ${a.fillers.items[0].count}×). Try a short silent pause instead.`);
  if (a.pauses && a.pauses.long >= 2)
    out.push(`There were ${a.pauses.long} long pauses (2 seconds or more) while you were speaking. Planning your first few words before you start can help.`);
  const top = Object.entries(a.grammar.byCategory).sort((x, y) => y[1] - x[1])[0];
  if (top && top[1] >= 2) out.push(`${top[1]} corrections were about ${top[0].replace(/_/g, " ")} — that's the area to focus on next.`);
  if (a.vocabulary.mattr !== null && a.vocabulary.mattr < 0.6)
    out.push(`Your word variety score was ${a.vocabulary.mattr.toFixed(2)} (0–1). Try using a few different words instead of repeating the same ones.`);
  if (a.vocabulary.repeated[0] && a.vocabulary.repeated[0].count >= 4)
    out.push(`You repeated "${a.vocabulary.repeated[0].word}" ${a.vocabulary.repeated[0].count} times — look for a synonym.`);
  if (previous?.wpm && a.wpm) {
    const change = ((a.wpm - previous.wpm) / previous.wpm) * 100;
    if (Math.abs(change) >= 10)
      out.push(`Your pace ${change > 0 ? "rose" : "fell"} by ${Math.abs(Math.round(change))}% compared with your previous session (${Math.round(previous.wpm)} → ${Math.round(a.wpm)} wpm).`);
  }
  if (previous?.fillers.perHundredWords != null && a.fillers.perHundredWords != null) {
    const diff = a.fillers.perHundredWords - previous.fillers.perHundredWords;
    if (diff <= -1) out.push(`You used fewer filler words than last time (${previous.fillers.perHundredWords} → ${a.fillers.perHundredWords} per 100 words).`);
  }
  return out;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
