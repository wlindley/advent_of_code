import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export interface PlaybackState {
  readonly step: number;
  readonly isPlaying: boolean;
  readonly speedMs: number;
  readonly setStep: (nextStep: number) => void;
  readonly togglePlay: () => void;
  readonly setSpeedMs: (nextSpeedMs: number) => void;
}

function clampStep(step: number, maxStep: number): number {
  return Math.max(0, Math.min(step, maxStep));
}

function usePlaybackReset(
  resetKey: unknown,
  setStepState: Dispatch<SetStateAction<number>>,
  setIsPlaying: Dispatch<SetStateAction<boolean>>,
): void {
  useEffect(() => {
    setStepState(0);
    setIsPlaying(false);
  }, [resetKey, setStepState, setIsPlaying]);
}

function usePlaybackTimer(
  isPlaying: boolean,
  step: number,
  maxStep: number,
  speedMs: number,
  setStepState: Dispatch<SetStateAction<number>>,
  setIsPlaying: Dispatch<SetStateAction<boolean>>,
): void {
  useEffect(() => {
    if (!isPlaying || step >= maxStep) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(maxStep, step + 1);
      setStepState(next);
      if (next >= maxStep) setIsPlaying(false);
    }, speedMs);
    return () => window.clearTimeout(timer);
  }, [isPlaying, step, maxStep, speedMs, setStepState, setIsPlaying]);
}

/** Shared step-playback timer hook for interactive puzzle visualizers. */
export function usePlayback(totalSteps: number, resetKey: unknown, defaultSpeedMs = 180): PlaybackState {
  const [step, setStepState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(defaultSpeedMs);
  const maxStep = Math.max(0, totalSteps - 1);
  const clampedStep = clampStep(step, maxStep);

  usePlaybackReset(resetKey, setStepState, setIsPlaying);
  usePlaybackTimer(isPlaying, clampedStep, maxStep, speedMs, setStepState, setIsPlaying);

  const setStep = useCallback((nextStep: number) => {
    setIsPlaying(false);
    setStepState(clampStep(nextStep, maxStep));
  }, [maxStep]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (maxStep === 0) return;
    if (clampedStep >= maxStep) setStepState(0);
    setIsPlaying(true);
  }, [isPlaying, clampedStep, maxStep]);

  return { step: clampedStep, isPlaying, speedMs, setStep, togglePlay, setSpeedMs };
}
