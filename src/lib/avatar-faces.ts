import type { TutorId } from "./tutors";

/**
 * Simli face IDs built from each tutor's portrait. Face IDs are not secret; the API key is
 * (SIMLI_API_KEY, server only). Generate them with `bun scripts/create-avatar-faces.ts`.
 * A tutor without an entry falls back to the honest "photo in a voice call" view.
 */
export const AVATAR_FACE_IDS: Partial<Record<TutorId, string>> = {};
