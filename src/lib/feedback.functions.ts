import { createServerFn } from "@tanstack/react-start";

import { recapInput, turnFeedbackInput } from "./feedback-schema";
import { analyzeTurn, buildRecap } from "./feedback.server";

export const getTurnFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => turnFeedbackInput.parse(data))
  .handler(async ({ data }) => analyzeTurn(data));

export const getSessionRecap = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => recapInput.parse(data))
  .handler(async ({ data }) => buildRecap(data));
