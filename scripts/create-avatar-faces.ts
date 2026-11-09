/**
 * One-off: builds a Simli Trinity-2 face from each tutor portrait and writes the face IDs to
 * src/lib/avatar-faces.ts. Needs SIMLI_API_KEY in the environment.
 *   bun scripts/create-avatar-faces.ts            enqueue faces for tutors without an ID
 *   bun scripts/create-avatar-faces.ts --status   show build status of existing IDs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { AVATAR_FACE_IDS } from "../src/lib/avatar-faces";
import { TUTOR_IDS } from "../src/lib/tutors";

const API = "https://api.simli.ai";
const key = process.env["SIMLI_API_KEY"];
if (!key) throw new Error("SIMLI_API_KEY is not set");
const root = join(import.meta.dir, "..");

if (process.argv.includes("--status")) {
  for (const [tutor, faceId] of Object.entries(AVATAR_FACE_IDS)) {
    const res = await fetch(`${API}/faces/trinity/generation_status?face_id=${faceId}`, {
      headers: { "x-simli-api-key": key },
    });
    console.log(tutor, faceId, res.status, (await res.text()).slice(0, 400));
  }
  process.exit(0);
}

const ids: Record<string, string> = { ...AVATAR_FACE_IDS };
for (const tutor of TUTOR_IDS) {
  if (ids[tutor]) continue;
  const form = new FormData();
  const image = readFileSync(join(root, `src/assets/tutor-${tutor}.jpg`));
  form.append("image", new Blob([image], { type: "image/jpeg" }), `${tutor}.jpg`);
  const res = await fetch(`${API}/faces/trinity?gsVersion=GSA_2.0&face_name=ene-${tutor}`, {
    method: "POST",
    headers: { "x-simli-api-key": key },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(tutor, res.status, text.slice(0, 400));
    continue;
  }
  const json = JSON.parse(text) as { face_id?: string; message?: string };
  if (!json.face_id) {
    console.error(tutor, "no face_id", text.slice(0, 400));
    continue;
  }
  ids[tutor] = json.face_id;
  console.log(tutor, json.face_id, json.message ?? "");
}

const file = join(root, "src/lib/avatar-faces.ts");
const source = readFileSync(file, "utf8").replace(
  /export const AVATAR_FACE_IDS[^;]*;/s,
  `export const AVATAR_FACE_IDS: Partial<Record<TutorId, string>> = ${JSON.stringify(ids, null, 2)};`,
);
writeFileSync(file, source);
