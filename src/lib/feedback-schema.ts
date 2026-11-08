import { z } from "zod";

import { LEVEL_IDS, NATIVE_LANGUAGE_IDS } from "./languages";
import { SCENARIO_IDS } from "./scenarios";
import { TUTOR_IDS } from "./tutors";

export const MISTAKE_CATEGORIES = [
  "tense",
  "articles",
  "prepositions",
  "word_order",
  "agreement",
  "vocabulary",
  "plurals",
  "pronouns",
  "fluency",
  "other",
] as const;
export type MistakeCategory = (typeof MISTAKE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<MistakeCategory, string> = {
  tense: "Verb tenses",
  articles: "Articles (a / an / the)",
  prepositions: "Prepositions",
  word_order: "Word order",
  agreement: "Subject–verb agreement",
  vocabulary: "Word choice",
  plurals: "Plurals",
  pronouns: "Pronouns",
  fluency: "Natural phrasing",
  other: "Other",
};

/* ---------- Per-turn feedback ---------- */

export const turnFeedbackSchema = z
  .object({
    verdict: z.enum(["natural", "minor", "needs_work"]),
    corrections: z.array(
      z
        .object({
          original: z.string(),
          corrected: z.string(),
          category: z.enum(MISTAKE_CATEGORIES),
          explanation: z.string(),
        })
        .strict(),
    ),
    better_version: z.string().nullable(),
    encouragement: z.string(),
  })
  .strict();
export type TurnFeedback = z.infer<typeof turnFeedbackSchema>;

export const turnFeedbackInput = z
  .object({
    text: z.string().trim().min(1).max(1200),
    tutorLine: z.string().max(600).nullable(),
    nativeLanguage: z.enum(NATIVE_LANGUAGE_IDS),
    level: z.enum(LEVEL_IDS),
  })
  .strict();
export type TurnFeedbackInput = z.infer<typeof turnFeedbackInput>;

/* ---------- End-of-session recap ---------- */

export const recapSchema = z
  .object({
    headline: z.string(),
    summary: z.string(),
    strengths: z.array(z.string()),
    pronunciation_notes: z.array(
      z.object({ word: z.string(), sounds_like: z.string(), tip: z.string() }).strict(),
    ),
    vocabulary: z.array(
      z.object({ term: z.string(), meaning: z.string(), example: z.string() }).strict(),
    ),
    practice_prompts: z.array(z.object({ prompt: z.string(), why: z.string() }).strict()),
  })
  .strict();
export type SessionRecap = z.infer<typeof recapSchema>;

export const recapInput = z
  .object({
    nativeLanguage: z.enum(NATIVE_LANGUAGE_IDS),
    level: z.enum(LEVEL_IDS),
    tutorId: z.enum(TUTOR_IDS),
    scenarioId: z.enum(SCENARIO_IDS),
    turns: z
      .array(
        z
          .object({
            role: z.enum(["learner", "tutor"]),
            text: z.string().max(1500),
          })
          .strict(),
      )
      .min(1)
      .max(80),
    corrections: z
      .array(
        z
          .object({
            original: z.string().max(400),
            corrected: z.string().max(400),
            category: z.enum(MISTAKE_CATEGORIES),
          })
          .strict(),
      )
      .max(40),
  })
  .strict();
export type RecapInput = z.infer<typeof recapInput>;

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };
