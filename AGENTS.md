<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Learner data (profile, sessions, mistakes) goes through `src/lib/learner-store.ts` only; it is localStorage today so it can be swapped for a backend without touching pages.
- Live voice calls use the persistent `/api/live` relay (`src/lib/live-relay.server.ts`, dev adapter `live-vite-plugin.ts`, dispatched from `src/server.ts`); session prompts are built server-side from enum-only `app.start` context so no learner free text reaches the voice prompt.
- Tutor personas live in `src/lib/tutors.ts` (shared with the relay, no image imports); portraits live in `src/lib/tutor-media.ts`.
- Text feedback and recaps use `generateStructured` in `src/lib/ai-gateway.server.ts` (streamed Responses + strict schema) behind server functions in `src/lib/feedback.functions.ts`.
- Real-time video avatars use Simli: `src/lib/avatar.ts` (browser SDK, dynamically imported), tokens minted server-side in `src/lib/avatar.functions.ts` (SIMLI_API_KEY never in the browser), per-tutor face IDs in `src/lib/avatar-faces.ts` (built by `scripts/create-avatar-faces.ts`). The tutor's voice track is routed through the avatar so audio and lips stay in sync; any tutor/session without a working avatar must be labelled as a photo in a voice call, never as live video.
