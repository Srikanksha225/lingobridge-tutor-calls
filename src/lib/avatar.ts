import { AVATAR_FACE_IDS } from "./avatar-faces";
import type { TutorId } from "./tutors";

/**
 * Real-time video avatar (Simli). The tutor's live voice track is streamed to Simli, which
 * returns a lip-synced video of the tutor plus the matching audio. Tutors without a face ID
 * keep the portrait, labelled honestly as a photo in a voice call.
 */
export function hasLiveAvatar(tutorId: TutorId): boolean {
  return Boolean(AVATAR_FACE_IDS[tutorId]);
}

export type AvatarHandle = {
  /** Stream the tutor's voice into the avatar so it lip-syncs. */
  listenTo(track: MediaStreamTrack): void;
  stop(): void;
};

export async function startLiveAvatar(options: {
  token: string;
  video: HTMLVideoElement;
  audio: HTMLAudioElement;
  onSpeaking: (speaking: boolean) => void;
  onEnded: (reason: string) => void;
}): Promise<AvatarHandle> {
  // Browser-only SDK: load it after hydration, never during SSR.
  const { SimliClient, LogLevel } = await import("simli-client");
  const client = new SimliClient(options.token, options.video, options.audio, null, LogLevel.ERROR);
  let stopped = false;
  client.on("speaking", () => options.onSpeaking(true));
  client.on("silent", () => options.onSpeaking(false));
  client.on("error", (detail) => {
    if (!stopped) options.onEnded(detail);
  });
  client.on("stop", () => {
    if (!stopped) options.onEnded("stopped");
  });
  await client.start();
  return {
    listenTo: (track) => client.listenToMediastreamTrack(track),
    stop: () => {
      if (stopped) return;
      stopped = true;
      void client.stop().catch(() => undefined);
    },
  };
}
