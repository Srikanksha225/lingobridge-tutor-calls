import { useEffect, useRef, useState } from "react";

import { hasLiveAvatar, startLiveAvatar, type AvatarHandle } from "@/lib/avatar";
import { getAvatarSessionToken } from "@/lib/avatar.functions";
import type { TutorId } from "@/lib/tutors";

export type AvatarState = "unavailable" | "idle" | "starting" | "live" | "failed";

/**
 * Runs the tutor's live video avatar while a call is active. The tutor's voice element is muted
 * once its track is routed through the avatar, so the learner hears lip-synced audio only.
 */
export function useLiveAvatar({
  tutorId,
  active,
  voiceAudioRef,
}: {
  tutorId: TutorId;
  active: boolean;
  voiceAudioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const enabled = hasLiveAvatar(tutorId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AvatarState>(enabled ? "idle" : "unavailable");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!enabled || !active) return;
    let cancelled = false;
    let handle: AvatarHandle | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;

    const restoreVoice = () => {
      clearInterval(poll);
      if (voiceAudioRef.current) voiceAudioRef.current.muted = false;
    };
    const fail = () => {
      if (cancelled) return;
      handle?.stop();
      handle = undefined;
      restoreVoice();
      setSpeaking(false);
      setState("failed");
    };

    setState("starting");
    void (async () => {
      const res = await getAvatarSessionToken({ data: { tutorId } });
      if (cancelled) return;
      if (!res.ok) return fail();
      const video = videoRef.current;
      const audio = audioRef.current;
      if (!video || !audio) return fail();
      const started = await startLiveAvatar({
        token: res.token,
        video,
        audio,
        onSpeaking: (value) => !cancelled && setSpeaking(value),
        onEnded: fail,
      });
      if (cancelled) return started.stop();
      handle = started;
      setState("live");
      // Route the tutor's voice through the avatar as soon as it arrives.
      poll = setInterval(() => {
        const stream = voiceAudioRef.current?.srcObject;
        const track = stream instanceof MediaStream ? stream.getAudioTracks()[0] : undefined;
        if (!track || !handle) return;
        clearInterval(poll);
        handle.listenTo(track);
        if (voiceAudioRef.current) voiceAudioRef.current.muted = true;
      }, 150);
    })().catch(fail);

    return () => {
      cancelled = true;
      handle?.stop();
      restoreVoice();
      setSpeaking(false);
      setState("idle");
    };
  }, [enabled, active, tutorId, voiceAudioRef]);

  return { enabled, state, speaking, videoRef, audioRef };
}
