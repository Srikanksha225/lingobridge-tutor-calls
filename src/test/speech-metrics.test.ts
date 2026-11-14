import { describe, expect, it } from "vitest";

import {
  analyzeSpeech,
  countWords,
  findFillers,
  movingTypeTokenRatio,
  paceLabel,
  pauseStats,
  subtractSegments,
  wordsPerMinute,
} from "@/lib/speech-metrics";

describe("speaking speed", () => {
  it("uses actual speaking time: 120 words in 60 s of speech is 120 wpm", () => {
    expect(wordsPerMinute(120, 60_000)).toBe(120);
  });
  it("needs at least 5 seconds of speech", () => {
    expect(wordsPerMinute(10, 4000)).toBeNull();
  });
  it("labels pace bands: <100 slow, 100–160 moderate, >160 fast", () => {
    expect(paceLabel(90)).toBe("slow");
    expect(paceLabel(130)).toBe("moderate");
    expect(paceLabel(175)).toBe("fast");
  });
  it("ignores silence when computing wpm in analyzeSpeech", () => {
    const text = Array.from({ length: 60 }, () => "word").join(" ");
    // 30 s of actual speech inside a 5-minute session → 120 wpm, not 12.
    const a = analyzeSpeech({
      source: "live-voice",
      sessionMs: 300_000,
      utterances: [text],
      learnerSegments: [{ start: 0, end: 15_000 }, { start: 100_000, end: 115_000 }],
    });
    expect(a.wpm).toBe(120);
  });
});

describe("pauses", () => {
  it("separates normal pauses, hesitations (≥1 s) and long pauses (≥2 s)", () => {
    const s = pauseStats([
      { start: 0, end: 1000 },
      { start: 1500, end: 2000 }, // 500 ms normal
      { start: 3200, end: 4000 }, // 1200 ms hesitation
      { start: 6500, end: 7000 }, // 2500 ms long hesitation
    ]);
    expect(s.count).toBe(3);
    expect(s.normal).toBe(1);
    expect(s.hesitations).toBe(2);
    expect(s.long).toBe(1);
  });
  it("does not count gaps where the tutor was talking", () => {
    const s = pauseStats([{ start: 0, end: 1000 }, { start: 3000, end: 4000 }], [{ start: 1200, end: 2800 }]);
    expect(s.count).toBe(0);
  });
  it("ignores silences longer than 6 s (turn-taking, not hesitation)", () => {
    expect(pauseStats([{ start: 0, end: 1000 }, { start: 8000, end: 9000 }]).count).toBe(0);
  });
  it("removes tutor echo from learner speaking time", () => {
    expect(subtractSegments([{ start: 0, end: 1000 }], [{ start: 400, end: 600 }])).toEqual([
      { start: 0, end: 400 },
      { start: 600, end: 1000 },
    ]);
  });
});

describe("filler words", () => {
  it("counts hesitation sounds", () => {
    const f = findFillers(["Um, I think, uh, it was good. Umm yes."]);
    expect(f.find((x) => x.word === "um")?.count).toBe(2);
    expect(f.find((x) => x.word === "uh")?.count).toBe(1);
  });
  it("does not count 'like' or 'you know' used as content", () => {
    expect(findFillers(["I like tea and you know the answer."])).toEqual([]);
  });
  it("counts 'like' and 'you know' in filler position", () => {
    const f = findFillers(["It was, like, really big, you know."]);
    expect(f.map((x) => x.word).sort()).toEqual(["like", "you know"]);
  });
});

describe("vocabulary", () => {
  it("counts words across scripts", () => {
    expect(countWords("I'm going home — నేను")).toBe(4);
  });
  it("needs 25 words for the variety score", () => {
    expect(movingTypeTokenRatio(["a", "b"])).toBeNull();
    expect(movingTypeTokenRatio(Array.from({ length: 30 }, () => "same"))).toBe(0.04);
  });
});

describe("pronunciation", () => {
  it("is never scored from text", () => {
    const a = analyzeSpeech({ source: "text", sessionMs: 1000, utterances: ["hello"], learnerSegments: null });
    expect(a.pronunciation.available).toBe(false);
    expect(a.wpm).toBeNull();
  });
});
