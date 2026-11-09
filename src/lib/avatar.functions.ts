import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { AVATAR_FACE_IDS } from "./avatar-faces";
import { TUTOR_IDS } from "./tutors";

export type AvatarTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: "not_configured" | "unavailable" };

/** Mints a short-lived Simli session token so the API key never reaches the browser. */
export const getAvatarSessionToken = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ tutorId: z.enum(TUTOR_IDS) }).parse(data))
  .handler(async ({ data }): Promise<AvatarTokenResult> => {
    const apiKey = process.env.SIMLI_API_KEY;
    const faceId = AVATAR_FACE_IDS[data.tutorId];
    if (!apiKey || !faceId) return { ok: false, reason: "not_configured" };
    try {
      const res = await fetch("https://api.simli.ai/compose/token", {
        method: "POST",
        headers: { "content-type": "application/json", "x-simli-api-key": apiKey },
        body: JSON.stringify({
          faceId,
          handleSilence: true,
          maxSessionLength: 1800,
          maxIdleTime: 120,
          streaming_width: 1024,
          streaming_height: 576,
        }),
      });
      if (!res.ok) {
        console.error("Avatar token request failed", res.status, (await res.text()).slice(0, 300));
        return { ok: false, reason: "unavailable" };
      }
      const json = (await res.json()) as { session_token?: unknown };
      if (typeof json.session_token !== "string") return { ok: false, reason: "unavailable" };
      return { ok: true, token: json.session_token };
    } catch (error) {
      console.error("Avatar token request failed", error);
      return { ok: false, reason: "unavailable" };
    }
  });
