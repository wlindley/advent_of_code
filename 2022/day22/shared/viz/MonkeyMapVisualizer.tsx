import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  computePassword,
  DEFAULT_TRACE_MAX_STEPS,
  FACING_SYMBOLS,
  type MonkeyMapInput,
  type MonkeyMapTraceFrame,
  type Pose,
} from '../index';
import { BoardCanvas } from './boardCanvasRender';

export interface MonkeyMapVisualizerProps {
  readonly rawInput: string;
  readonly solver: Required<PuzzleSolver<MonkeyMapInput, number, MonkeyMapTraceFrame>>;
  readonly partLabel: string;
  readonly faceSize?: number;
}

type VizState =
  | { readonly ok: true; readonly input: MonkeyMapInput; readonly frames: readonly MonkeyMapTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: Required<PuzzleSolver<MonkeyMapInput, number, MonkeyMapTraceFrame>>,
): VizState {
  try {
    const input = solver.parse(rawInput);
    const frames = solver.trace(input, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
    return { ok: true, input, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatPose(pose: Pose): string {
  return `(${pose.row + 1}, ${pose.col + 1}) ${FACING_SYMBOLS[pose.facing]}`;
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

/** Shared interactive Monkey Map visualizer for Day 22 Parts 1 and 2. */
export function MonkeyMapVisualizer({
  rawInput,
  solver,
  partLabel,
  faceSize,
}: MonkeyMapVisualizerProps) {
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

  const finalFrame = frames[frames.length - 1]!;
  const isComplete = playback.step === frames.length - 1;
  const password = computePassword(frame.pose);
  const finalPassword = computePassword(finalFrame.pose);

  return (
    <div className="stack">
      <div className="meta-row">
        <span className="badge">{partLabel}</span>
        <span className="badge">
          Instruction <code>{frame.instructionIndex}</code> / <code>{frame.totalInstructions}</code>
        </span>
        <span className="badge">
          Pose <code>{formatPose(frame.pose)}</code>
        </span>
        <span className={isComplete ? 'badge status-solved' : 'badge'}>
          Password:{' '}
          <strong className="gold">
            <code>{password}</code>
          </strong>
          {!isComplete && <> (final <code>{finalPassword}</code>)</>}
        </span>
      </div>
      <div
        style={{
          padding: '0.55rem 0.75rem',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: '0.9rem',
        }}
      >
        <strong>{frame.stepText}</strong>
        {frame.lastWrap !== null && (
          <>
            {' '}
            — wrap <code>{formatPose(frame.lastWrap.from)}</code> →{' '}
            <code>{formatPose(frame.lastWrap.to)}</code>
          </>
        )}
      </div>
      <BoardCanvas board={state.input.board} frame={frame} faceSize={faceSize} />
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
