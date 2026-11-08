import { describe, expect, it } from "vitest";

import { explanationLanguage } from "@/lib/languages";
import {
  levelFromPlacement,
  practiceStreak,
  recurringMistakes,
  type MistakeRecord,
} from "@/lib/learner-store";
import { appendCaption, completedLearnerRows } from "@/lib/transcript";

const mistake = (category: MistakeRecord["category"], at: string): MistakeRecord => ({
  id: at,
  category,
  original: "x",
  corrected: "y",
  explanation: "",
  at,
  sessionId: null,
});

describe("placement level", () => {
  it("4 or 5 of 5 correct places the learner at advanced", () => {
    expect(levelFromPlacement(4, 5)).toBe("advanced");
  });
  it("2 or 3 of 5 correct places the learner at intermediate", () => {
    expect(levelFromPlacement(2, 5)).toBe("intermediate");
  });
  it("0 or 1 of 5 correct places the learner at beginner", () => {
    expect(levelFromPlacement(1, 5)).toBe("beginner");
  });
});

describe("recurring mistakes memory", () => {
  it("only counts a category as recurring once it appears at least twice", () => {
    const result = recurringMistakes([
      mistake("tense", "2026-01-01"),
      mistake("tense", "2026-01-02"),
      mistake("articles", "2026-01-03"),
    ]);
    expect(result.map((r) => r.category)).toEqual(["tense"]);
    expect(result[0]?.count).toBe(2);
  });
});

describe("explanation language", () => {
  it("explains in the learner's native language", () => {
    expect(explanationLanguage("telugu")).toBe("Telugu");
  });
  it("falls back to simple English for Other", () => {
    expect(explanationLanguage("other")).toBe("simple English");
  });
});

describe("practice streak", () => {
  it("counts consecutive days ending today", () => {
    const now = new Date(2026, 10, 8, 12);
    const sessions = [new Date(2026, 10, 8, 9), new Date(2026, 10, 7, 9), new Date(2026, 10, 5, 9)].map((d) => ({
      startedAt: d.toISOString(),
    }));
    expect(practiceStreak(sessions, now)).toBe(2);
  });
});

describe("live captions grouping", () => {
  it("joins fragments from the same speaker and splits on speaker change", () => {
    let rows = appendCaption([], "tutor", "Hi there");
    rows = appendCaption(rows, "tutor", ", how are you?");
    rows = appendCaption(rows, "learner", "I am fine thanks");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.text).toBe("Hi there, how are you?");
    expect(completedLearnerRows(rows)).toHaveLength(0);
    rows = appendCaption(rows, "tutor", "Great!");
    expect(completedLearnerRows(rows).map((r) => r.text)).toEqual(["I am fine thanks"]);
  });
});
