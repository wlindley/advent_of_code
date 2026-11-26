import { useEffect, useState } from 'react';

export interface PlaybackState {
  readonly step: number;
  readonly isPlaying: boolean;
  readonly speedMs: number;
  readonly setStep: (nextStep: number) => void;
  readonly togglePlay: () => void;
  readonly setSpeedMs: (nextSpeedMs: number) => void;
}

/** Shared step-playback timer hook for interactive puzzle visualizers. */
export function usePlayback(
  totalSteps: number,
  resetKey: unknown,
  defaultSpeedMs = 180,
): PlaybackState {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(defaultSpeedMs);

  useEffect(() => {
    setStep(0);
    setIsPlaying(false);
  }, [resetKey]);

  useEffect(() => {
    if (!isPlaying || step >= totalSteps - 1) return;
    const timer = window.setTimeout(() => {
      setStep((prev) => {
        const next = Math.min(totalSteps - 1, prev + 1);
        if (next >= totalSteps - 1) setIsPlaying(false);
        return next;
      });
    }, speedMs);
    return () => window.clearTimeout(timer);
  }, [isPlaying, step, totalSteps, speedMs]);

  return {
    step: Math.min(step, Math.max(0, totalSteps - 1)),
    isPlaying,
    speedMs,
    setStep,
    togglePlay: () => setIsPlaying((playing) => !playing),
    setSpeedMs,
  };
}
