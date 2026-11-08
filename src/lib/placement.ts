export type PlacementQuestion = { prompt: string; options: string[]; answer: number };

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  { prompt: "She ___ to work by bus every day.", options: ["go", "goes", "going"], answer: 1 },
  { prompt: "I have lived in this city ___ 2019.", options: ["for", "from", "since"], answer: 2 },
  {
    prompt: "Could you tell me where ___?",
    options: ["is the station", "the station is", "does the station"],
    answer: 1,
  },
  { prompt: "If I ___ more time, I would learn to play the guitar.", options: ["had", "have", "will have"], answer: 0 },
  {
    prompt: "By the time we arrived, the film ___.",
    options: ["already starts", "has already start", "had already started"],
    answer: 2,
  },
];
