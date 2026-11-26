import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import { type BasinFrame, type BlizzardBasin, DEFAULT_TRACE_MAX_STEPS } from '../index';
import { BasinCanvas } from './basinCanvasRender';

export interface BasinVisualizerProps {
  readonly rawInput: string;
  readonly solver: Required<PuzzleSolver<BlizzardBasin, number, BasinFrame>>;
  readonly partLabel: string;
}

type VizState =
  | { readonly ok: true; readonly basin: BlizzardBasin; readonly frames: readonly BasinFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: Required<PuzzleSolver<BlizzardBasin, number, BasinFrame>>,
): VizState {
  try {
    const basin = solver.parse(rawInput);
    const frames = solver.trace(basin, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
    return { ok: true, basin, frames };
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

/** Shared interactive Blizzard Basin visualizer for Day 24 Parts 1 and 2. */
export function BasinVisualizer({ rawInput, solver, partLabel }: BasinVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 200);
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

  return (
    <div className="stack">
      <div className="meta-row">
        <span className="badge">{partLabel}</span>
        <span className="badge">
          Minute <code>{frame.minute}</code> / <code>{finalFrame.minute}</code>
        </span>
        <span className="badge">
          Leg <code>{frame.legIndex + 1}</code> / <code>{frame.legCount}</code>
        </span>
        <span className="badge">
          Action <code>{frame.action}</code> · Frontier <code>{frame.frontierCount}</code>
        </span>
        <span className="badge">
          Valley <code>{state.basin.width}×{state.basin.height}</code> (period{' '}
          <code>{state.basin.period}</code>)
        </span>
        <span className={isComplete ? 'badge status-solved' : 'badge'}>
          <strong className="gold">
            {isComplete ? `Shortest trip: ${finalFrame.minute} min` : `Elapsed: ${frame.minute} min`}
          </strong>
        </span>
      </div>
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center',
          padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem',
        }}
      >
        <span><strong style={{ color: 'var(--ok)' }}>●</strong> Expedition ({frame.position.row}, {frame.position.col})</span>
        <span><strong style={{ color: 'var(--accent)' }}>■</strong> Blizzards ({state.basin.blizzardCount})</span>
        <span><strong style={{ color: 'var(--gold)' }}>━</strong> Shortest-path trail</span>
      </div>
      <BasinCanvas basin={state.basin} frames={frames} step={playback.step} />
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
