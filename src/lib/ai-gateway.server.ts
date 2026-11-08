import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText, type ModelMessage } from "ai";
import type { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

export const GATEWAY_URL = "https://ai.gateway.lovable.dev";
export const CHAT_MODEL = "openai/gpt-6-astra";

function gatewayError(error: unknown): string {
  const status =
    error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : undefined;
  if (status === 402) return "AI credits have run out for this workspace. Add credits to keep getting feedback.";
  if (status === 429) return "The tutor is a little busy right now. Please try again in a moment.";
  if (status === 403) return "AI feedback isn't available for this workspace right now.";
  return "Feedback could not be generated. Please try again.";
}

/**
 * Streams a structured Responses call through the Lovable AI Gateway and returns the final object.
 * Never throws: failures come back as `{ ok: false }` with a learner-friendly message.
 */
export async function generateStructured<T>(options: {
  schema: z.ZodType<T>;
  instructions: string;
  messages: ModelMessage[];
  signal?: AbortSignal;
}): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { ok: false, error: "AI is not configured for this app yet." };

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: `${GATEWAY_URL}/v1`,
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  try {
    let streamError: unknown;
    const result = streamText({
      model: provider.responses(CHAT_MODEL),
      instructions: options.instructions,
      messages: options.messages,
      output: Output.object({ schema: options.schema }),
      ...(options.signal ? { abortSignal: options.signal } : {}),
      maxRetries: 1,
      onError: ({ error }) => {
        streamError = error;
      },
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    // Drain the stream fully so the request completes cleanly before reading the object.
    for await (const part of result.fullStream) {
      if (part.type === "error") streamError = part.error;
    }
    if (streamError) {
      console.error("AI gateway stream error", streamError);
      return { ok: false, error: gatewayError(streamError) };
    }
    const data = (await result.output) as T;
    return { ok: true, data };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error("AI returned an unexpected shape", error.text?.slice(0, 300));
      return { ok: false, error: "The feedback came back incomplete. Please try again." };
    }
    console.error("AI gateway call failed", error);
    return { ok: false, error: gatewayError(error) };
  }
}
