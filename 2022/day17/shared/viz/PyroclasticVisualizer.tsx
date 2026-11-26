import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_TRACE_MAX_STEPS,
  type JetPattern,
  type PyroclasticTraceFrame,
  ROCK_LABELS,
  traceTower,
} from '../index';
import { ChamberCanvas } from './ChamberCanvas';

export interface PyroclasticVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<JetPattern, bigint, PyroclasticTraceFrame>;
  readonly partLabel: string;
  readonly targetRocks: bigint;
}

type VizState =
  | { readonly ok: true; readonly jetLength: number; readonly frames: readonly PyroclasticTraceFrame[] }
  | { readonly ok: false; readonly message: string };

const LEGEND_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ['Last Settled Rock', 'var(--gold)'],
  ['Settled Rock', '#334155'],
  ['Reachable Air Cavity', 'rgba(8, 145, 178, 0.28)'],
  ['Sealed Air Pocket', 'rgba(100, 116, 139, 0.35)'],
];

function buildVizState(
  rawInput: string,
  solver: PuzzleSolver<JetPattern, bigint, PyroclasticTraceFrame>,
  targetRocks: bigint,
): VizState {
  try {
    const jets = solver.parse(rawInput);
    const frames = solver.trace
      ? solver.trace(jets, { maxSteps: DEFAULT_TRACE_MAX_STEPS })
      : traceTower(jets, targetRocks, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
    return { ok: true, jetLength: jets.length, frames };
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

function KpiBadges({
  frame,
  partLabel,
  jetLength,
}: {
  readonly frame: PyroclasticTraceFrame;
  readonly partLabel: string;
  readonly jetLength: number;
}) {
  const cycleText = frame.cycle
    ? `len ${frame.cycle.cycleLength} (+${frame.cycle.cycleHeightGain}/cycle, skipped ${frame.cycle.skippedCycles})`
    : 'searching';
  return (
    <div className="meta-row">
      <span className="badge">{partLabel}</span>
      <span className="badge">
        Rock: <code>{frame.rockNumber.toLocaleString()} / {frame.targetRocks.toLocaleString()}</code>
      </span>
      <span className="badge status-solved">
        Tower Height: <strong className="gold"><code>{frame.towerHeight.toLocaleString()}</code></strong>
      </span>
      <span className="badge">Jet Cursor: <code>{frame.nextJetIndex} / {jetLength}</code></span>
      <span className="badge">Next Shape: <code>{ROCK_LABELS[frame.nextRockIndex]!}</code></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Cycle: <code>{cycleText}</code>
      </span>
    </div>
  );
}

function ChamberLegend() {
  return (
    <div className="meta-row">
      {LEGEND_ITEMS.map(([label, color]) => (
        <span key={label} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Reusable interactive falling-rock chamber visualizer shared across Day 17 Part 1 and Part 2. */
export function PyroclasticVisualizer({ rawInput, solver, partLabel, targetRocks }: PyroclasticVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver, targetRocks), [rawInput, solver, targetRocks]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 140);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  return (
    <div className="stack">
      <KpiBadges frame={frame} partLabel={partLabel} jetLength={state.jetLength} />
      <ChamberCanvas frame={frame} />
      <ChamberLegend />
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
