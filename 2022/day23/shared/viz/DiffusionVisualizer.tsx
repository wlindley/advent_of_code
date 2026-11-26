import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_TRACE_MAX_STEPS,
  DIRECTION_LABELS,
  priorityOrderForRound,
  type DiffusionFrame,
  type ElfCoord,
} from '../index';
import { DiffusionCanvas } from './diffusionCanvasRender';

export interface DiffusionVisualizerProps {
  readonly rawInput: string;
  readonly solver: Required<PuzzleSolver<readonly ElfCoord[], number, DiffusionFrame>>;
  readonly partLabel: string;
  readonly formatAnswer: (frame: DiffusionFrame, finalFrame: DiffusionFrame) => string;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly DiffusionFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: Required<PuzzleSolver<readonly ElfCoord[], number, DiffusionFrame>>,
): VizState {
  try {
    const elves = solver.parse(rawInput);
    return { ok: true, frames: solver.trace(elves, { maxSteps: DEFAULT_TRACE_MAX_STEPS }) };
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

function formatPriority(round: number): string {
  const order = round > 0 ? priorityOrderForRound(round) : [0, 1, 2, 3];
  return order.map((d) => DIRECTION_LABELS[d]).join(' → ');
}

/** Shared interactive Unstable Diffusion visualizer for Day 23 Parts 1 and 2. */
export function DiffusionVisualizer({
  rawInput,
  solver,
  partLabel,
  formatAnswer,
}: DiffusionVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 220);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize input: {state.ok ? 'No trace frames' : state.message}
        </p>
      </div>
    );
  }

  const finalFrame = frames[frames.length - 1]!;
  const isComplete = playback.step === frames.length - 1;
  const bounds = frame.bounds;

  return (
    <div className="stack">
      <div className="meta-row">
        <span className="badge">{partLabel}</span>
        <span className="badge">
          Round <code>{frame.round}</code> / <code>{finalFrame.round}</code>
        </span>
        <span className="badge">
          Priority <code>{formatPriority(frame.round)}</code>
        </span>
        <span className="badge">
          Moved <code>{frame.movedCount}</code> / <code>{frame.elfCount}</code> · Collisions{' '}
          <code>{frame.collisionCount}</code>
        </span>
        <span className="badge">
          Box <code>{bounds.width}×{bounds.height}</code>
        </span>
        <span className={isComplete ? 'badge status-solved' : 'badge'}>
          <strong className="gold">{formatAnswer(frame, finalFrame)}</strong>
        </span>
      </div>
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center',
          padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem',
        }}
      >
        <span><strong style={{ color: '#0f766e' }}>●</strong> Stationary elf</span>
        <span><strong style={{ color: 'var(--ok)' }}>●</strong> Moved elf</span>
        <span><strong style={{ color: 'var(--gold)' }}>▢</strong> Tight bounding box ({frame.emptyGroundCount} empty)</span>
        {frame.isStatic && <span className="badge status-solved">Static equilibrium</span>}
      </div>
      <DiffusionCanvas frames={frames} frame={frame} />
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
