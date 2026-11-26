import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type PeakContributionMode,
  type TopographicMap,
  type TrailheadTraceFrame,
} from '../index';
import { TopographicCanvas } from './TopographicCanvas';

export interface TopographicVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<TopographicMap, number, TrailheadTraceFrame>;
  readonly mode: PeakContributionMode;
  readonly metricLabel: string;
  readonly metricUnit: string;
}

type VizState =
  | {
      readonly ok: true;
      readonly map: TopographicMap;
      readonly total: number;
      readonly frames: readonly TrailheadTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: PuzzleSolver<TopographicMap, number, TrailheadTraceFrame>,
): VizState {
  try {
    const map = solver.parse(rawInput);
    const total = solver.solve(map);
    const frames = solver.trace
      ? solver.trace(map, { maxSteps: DEFAULT_MAX_TRACE_STEPS })
      : [];
    return { ok: true, map, total, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function StatusHud({
  map,
  frame,
  total,
  metricLabel,
  metricUnit,
}: {
  readonly map: TopographicMap;
  readonly frame: TrailheadTraceFrame | null;
  readonly total: number;
  readonly metricLabel: string;
  readonly metricUnit: string;
}) {
  if (!frame) {
    return (
      <div className="meta-row">
        <span className="badge">Grid: <code>{map.rows}×{map.cols}</code></span>
        <span className="badge">Trailheads: <code>0</code></span>
        <span className="badge">Peaks: <code>{map.peakIndices().length}</code></span>
        <span className="badge">
          No height-0 trailheads — Total {metricLabel}: <strong className="gold"><code>{total}</code></strong>
        </span>
      </div>
    );
  }
  const [tr, tc] = map.coordsOf(frame.trailheadIndex);
  return (
    <div className="meta-row">
      <span className="badge">Grid: <code>{map.rows}×{map.cols}</code></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Trailhead: <code>#{frame.trailheadOrder + 1}/{frame.totalTrailheads}</code> ({tr},{tc})
      </span>
      <span className="badge">Basin: <code>{frame.reachableIndices.length}</code> cells</span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        {metricLabel}: <code>+{frame.trailheadContribution}</code> {metricUnit}
      </span>
      <span className="badge status-solved">
        Cumulative {metricLabel}: <strong className="gold"><code>{frame.cumulativeTotal}</code></strong> / <code>{total}</code>
      </span>
    </div>
  );
}

/** Shared interactive topographic visualizer parameterized by Part 1 / Part 2 scoring mode. */
export function TopographicVisualizer({
  rawInput,
  solver,
  mode,
  metricLabel,
  metricUnit,
}: TopographicVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${mode}`, 220);

  if (!state.ok) {
    return <p className="error-text">Unable to visualize input: {state.message}</p>;
  }

  const activeFrame = state.frames[playback.step] ?? null;

  return (
    <div>
      <StatusHud
        map={state.map}
        frame={activeFrame}
        total={state.total}
        metricLabel={metricLabel}
        metricUnit={metricUnit}
      />
      <div style={{ margin: '0.6rem 0' }}>
        <TopographicCanvas map={state.map} frame={activeFrame} mode={mode} />
      </div>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span><strong style={{ color: 'var(--accent)' }}>Blue ring & tint</strong>: trailhead &amp; uphill basin</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--gold)' }}>Gold beacon</strong>: {mode === 'score' ? 'reachable 9 peak' : 'peak path multiplicity'}</span>
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={(next) => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(next);
        }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
