import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_TRACE_MAX_STEPS,
  type MonkeyRiddle,
  type MonkeyTraceFrame,
} from '../index';
import { MonkeyTreeSvg } from './MonkeyTreeSvg';

export interface MonkeyMathVisualizerProps {
  readonly rawInput: string;
  readonly solver: Required<PuzzleSolver<MonkeyRiddle, bigint, MonkeyTraceFrame>>;
  readonly partLabel: string;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly MonkeyTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: Required<PuzzleSolver<MonkeyRiddle, bigint, MonkeyTraceFrame>>,
): VizState {
  try {
    const riddle = solver.parse(rawInput);
    const frames = solver.trace(riddle, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

/** Shared interactive Monkey Math visualizer for Day 21 Parts 1 & 2. */
export function MonkeyMathVisualizer({
  rawInput,
  solver,
  partLabel,
}: MonkeyMathVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 180);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <p className="error-text">
        Unable to visualize input: {state.ok ? 'No trace frames' : state.message}
      </p>
    );
  }

  const isComplete = frame.answerText === frame.finalAnswerText;

  return (
    <div className="stack">
      <div className="meta-row">
        <span className="badge">{partLabel}</span>
        <span className="badge">
          Reachable <code>{frame.reachableCount}</code>
        </span>
        <span className="badge">
          Step Progress <code>{frame.resolvedCount}</code>
        </span>
        <span className="badge">
          Active <code>{frame.activeName ?? '—'}</code>
        </span>
        <span className={isComplete ? 'badge status-solved' : 'badge'}>
          Answer:{' '}
          <strong className="gold">
            <code>{frame.answerText}</code>
          </strong>
          {!isComplete && <> / <code>{frame.finalAnswerText}</code></>}
        </span>
      </div>
      <div
        style={{
          padding: '0.55rem 0.75rem',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          color: 'var(--text)',
          fontSize: '0.9rem',
        }}
      >
        <strong>{frame.headline}:</strong> <code>{frame.formula}</code>
      </div>
      <MonkeyTreeSvg frame={frame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
