// Safe to edit by hand
// The home hero cross-fade is CSS-only. This computes each frame's animation-delay
// so a 5-frame, 8-second hero cycles in 40s with frame 1 (the LCP image) first.
export function frameAnimationDelays(frameCount: number, secondsPerFrame: number): number[] {
  return Array.from({ length: Math.max(1, frameCount) }, (_, i) => i * secondsPerFrame);
}
