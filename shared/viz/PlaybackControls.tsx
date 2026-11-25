import { useId } from 'react';

export interface PlaybackControlsProps {
  readonly step: number;
  readonly totalSteps: number;
  readonly isPlaying: boolean;
  readonly speedMs: number;
  readonly onTogglePlay: () => void;
  readonly onStepChange: (nextStep: number) => void;
  readonly onSpeedChange: (nextSpeedMs: number) => void;
}

export function PlaybackControls({
  step,
  totalSteps,
  isPlaying,
  speedMs,
  onTogglePlay,
  onStepChange,
  onSpeedChange,
}: PlaybackControlsProps) {
  const stepId = useId();
  const speedId = useId();
  const maxStep = Math.max(0, totalSteps - 1);

  return (
    <div className="playback-controls" role="group" aria-label="Visualization playback controls">
      <div className="playback-buttons">
        <button type="button" onClick={onTogglePlay} disabled={maxStep === 0}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={() => onStepChange(Math.max(0, step - 1))} disabled={step <= 0}>
          Prev
        </button>
        <button type="button" onClick={() => onStepChange(Math.min(maxStep, step + 1))} disabled={step >= maxStep}>
          Next
        </button>
        <button type="button" onClick={() => onStepChange(0)} disabled={step === 0}>
          Reset
        </button>
      </div>
      <label className="slider-field" htmlFor={stepId}>
        <span>Step {Math.min(step + 1, totalSteps)} / {Math.max(1, totalSteps)}</span>
        <input
          id={stepId}
          type="range"
          min={0}
          max={maxStep}
          value={step}
          onChange={(event) => onStepChange(Number(event.target.value))}
          disabled={maxStep === 0}
        />
      </label>
      <label className="slider-field" htmlFor={speedId}>
        <span>Delay {speedMs}ms</span>
        <input
          id={speedId}
          type="range"
          min={40}
          max={1000}
          step={20}
          value={speedMs}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
