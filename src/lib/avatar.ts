/**
 * Real-time video avatar integration point.
 *
 * LingoBridge currently runs tutor sessions as live voice calls and shows the tutor's portrait.
 * To add a real-time talking avatar (lip-synced video), implement this interface against the
 * provider's SDK and return it from `getAvatarProvider()`. The session page already renders
 * whatever `attach()` mounts and falls back to the portrait when no provider is configured.
 */
export type AvatarProvider = {
  name: string;
  /** Mount the provider's video into `container` for the given tutor; resolve when frames are flowing. */
  attach(container: HTMLElement, tutorId: string): Promise<void>;
  /** Feed the tutor's live audio so the avatar lip-syncs to it. */
  setAudioStream(stream: MediaStream | null): void;
  detach(): void;
};

export function getAvatarProvider(): AvatarProvider | null {
  return null;
}
