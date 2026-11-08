export const NATIVE_LANGUAGES = [
  { id: "telugu", name: "Telugu", native: "తెలుగు" },
  { id: "tamil", name: "Tamil", native: "தமிழ்" },
  { id: "hindi", name: "Hindi", native: "हिन्दी" },
  { id: "kannada", name: "Kannada", native: "ಕನ್ನಡ" },
  { id: "malayalam", name: "Malayalam", native: "മലയാളം" },
  { id: "bengali", name: "Bengali", native: "বাংলা" },
  { id: "english", name: "English", native: "English" },
  { id: "other", name: "Other", native: "Explanations in simple English" },
] as const;

export type NativeLanguageId = (typeof NATIVE_LANGUAGES)[number]["id"];
export const NATIVE_LANGUAGE_IDS = NATIVE_LANGUAGES.map((l) => l.id) as [
  NativeLanguageId,
  ...NativeLanguageId[],
];

/** Target languages. Only `available` ones can be selected today; the rest are on the roadmap. */
export const TARGET_LANGUAGES = [
  { id: "english", name: "English", native: "English", available: true },
  { id: "hindi", name: "Hindi", native: "हिन्दी", available: false },
  { id: "telugu", name: "Telugu", native: "తెలుగు", available: false },
  { id: "tamil", name: "Tamil", native: "தமிழ்", available: false },
  { id: "spanish", name: "Spanish", native: "Español", available: false },
  { id: "french", name: "French", native: "Français", available: false },
] as const;

export type TargetLanguageId = (typeof TARGET_LANGUAGES)[number]["id"];
export const AVAILABLE_TARGET_IDS = ["english"] as const;
export type AvailableTargetId = (typeof AVAILABLE_TARGET_IDS)[number];

export const LEVELS = [
  {
    id: "beginner",
    name: "Beginner",
    cefr: "A1–A2",
    blurb: "I know basic words and short phrases.",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    cefr: "B1–B2",
    blurb: "I can talk about everyday topics with some mistakes.",
  },
  {
    id: "advanced",
    name: "Advanced",
    cefr: "C1–C2",
    blurb: "I speak comfortably and want to sound more natural.",
  },
] as const;
export type LevelId = (typeof LEVELS)[number]["id"];
export const LEVEL_IDS = LEVELS.map((l) => l.id) as [LevelId, ...LevelId[]];

export const GOALS = [
  { id: "everyday", name: "Everyday conversation" },
  { id: "workplace", name: "Workplace communication" },
  { id: "interviews", name: "Job interviews" },
  { id: "travel", name: "Travel and daily life abroad" },
  { id: "confidence", name: "Overcome fear of speaking" },
  { id: "exams", name: "Exams (IELTS, TOEFL)" },
] as const;
export type GoalId = (typeof GOALS)[number]["id"];
export const GOAL_IDS = GOALS.map((g) => g.id) as [GoalId, ...GoalId[]];

/** Language used to explain mistakes. "Other" and "English" fall back to simple English. */
export function explanationLanguage(native: NativeLanguageId): string {
  const lang = NATIVE_LANGUAGES.find((l) => l.id === native);
  if (!lang || native === "other" || native === "english") return "simple English";
  return lang.name;
}

export function nativeName(id: NativeLanguageId) {
  return NATIVE_LANGUAGES.find((l) => l.id === id)?.name ?? "Other";
}
export function levelName(id: LevelId) {
  return LEVELS.find((l) => l.id === id)?.name ?? id;
}
export function goalName(id: GoalId) {
  return GOALS.find((g) => g.id === id)?.name ?? id;
}
