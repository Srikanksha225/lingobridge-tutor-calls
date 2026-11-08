import type { TutorId } from "./tutors";

export const SCENARIO_IDS = [
  "free",
  "introduce",
  "cafe",
  "doctor",
  "standup",
  "phone",
  "interview",
  "directions",
] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

export type Scenario = {
  id: ScenarioId;
  title: string;
  description: string;
  level: "Any" | "Beginner" | "Intermediate" | "Advanced";
  minutes: number;
  suggestedTutor: TutorId;
  /** Short, trusted instruction appended to the tutor's session prompt. */
  prompt: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "free",
    title: "Open conversation",
    description: "Talk about anything. Your tutor follows your lead.",
    level: "Any",
    minutes: 10,
    suggestedTutor: "maya",
    prompt: "Have an open conversation and follow the learner's interests.",
  },
  {
    id: "introduce",
    title: "Introduce yourself",
    description: "Practise talking about who you are, your family and work.",
    level: "Beginner",
    minutes: 5,
    suggestedTutor: "clara",
    prompt:
      "Help the learner introduce themselves: name, home town, family, work or studies, hobbies.",
  },
  {
    id: "cafe",
    title: "Ordering at a café",
    description: "Order food and drinks, ask questions, handle small problems.",
    level: "Beginner",
    minutes: 6,
    suggestedTutor: "maya",
    prompt:
      "Role-play: you are a friendly café server and the learner is the customer ordering food and drinks.",
  },
  {
    id: "doctor",
    title: "At the doctor",
    description: "Describe symptoms clearly and understand advice.",
    level: "Intermediate",
    minutes: 8,
    suggestedTutor: "clara",
    prompt: "Role-play: you are a calm doctor and the learner is a patient describing symptoms.",
  },
  {
    id: "standup",
    title: "Team stand-up update",
    description: "Share progress, blockers and plans in a work meeting.",
    level: "Intermediate",
    minutes: 8,
    suggestedTutor: "james",
    prompt:
      "Role-play a short team stand-up meeting. Ask the learner for yesterday's progress, today's plan and any blockers.",
  },
  {
    id: "phone",
    title: "Professional phone call",
    description: "Make a polite call to reschedule a meeting.",
    level: "Intermediate",
    minutes: 6,
    suggestedTutor: "james",
    prompt:
      "Role-play a professional phone call where the learner needs to reschedule a meeting with you.",
  },
  {
    id: "interview",
    title: "Mock job interview",
    description: "Answer common interview questions with structure and confidence.",
    level: "Advanced",
    minutes: 15,
    suggestedTutor: "priya",
    prompt:
      "Run a mock job interview: tell me about yourself, strengths, a challenge you solved, why this role.",
  },
  {
    id: "directions",
    title: "Asking for directions",
    description: "Find your way around a new city.",
    level: "Beginner",
    minutes: 5,
    suggestedTutor: "leo",
    prompt:
      "Role-play: the learner is a tourist asking you, a local, for directions and recommendations.",
  },
];

export function getScenario(id: string | undefined): Scenario {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]!;
}
