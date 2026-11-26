import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_TRACE_MAX_STEPS,
  type EncryptedFile,
  type MixingTraceFrame,
} from '../index';
import { GroveRingSvg } from './GroveRingSvg';

export interface GroveMixerVisualizerProps {
  readonly rawInput: string;
  readonly solver: Required<PuzzleSolver<EncryptedFile, bigint, MixingTraceFrame>>;
  readonly partLabel: string;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly MixingTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: Required<PuzzleSolver<EncryptedFile, bigint, MixingTraceFrame>>,
): VizState {
  try {
    const file = solver.parse(rawInput);
    const frames = solver.trace(file, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
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

/** Shared interactive ring mixing visualizer for Day 20 Parts 1 & 2. */
export function GroveMixerVisualizer({
  rawInput,
  solver,
  partLabel,
}: GroveMixerVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 140);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <p className="error-text">
        Unable to visualize input: {state.ok ? 'No trace frames' : state.message}
      </p>
    );
  }

  const { coordinates, lastMove } = frame;
  const isComplete = frame.moveCount === frame.totalMoves;

  return (
    <div className="stack">
      <div className="meta-row">
        <span className="badge">{partLabel}</span>
        <span className="badge">
          Round <code>{frame.round} / {frame.totalRounds}</code>
        </span>
        <span className="badge">
          Move <code>{frame.moveCount} / {frame.totalMoves}</code>
        </span>
        <span className="badge">
          {lastMove
            ? <>Active <code>#{frame.activeId}</code> ({lastMove.fromIndex} → {lastMove.toIndex}, +{lastMove.steps})</>
            : 'Initial Ring'}
        </span>
        <span className="badge">
          +1k/+2k/+3k:{' '}
          <code>
            {coordinates.first.toString()}, {coordinates.second.toString()}, {coordinates.third.toString()}
          </code>
        </span>
        <span className={isComplete ? 'badge status-solved' : 'badge'}>
          Sum:{' '}
          <strong className="gold">
            <code>{coordinates.sum.toLocaleString()}</code>
          </strong>
          {!isComplete && <> / <code>{frame.finalSum.toLocaleString()}</code></>}
        </span>
      </div>
      <GroveRingSvg frame={frame} />
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
