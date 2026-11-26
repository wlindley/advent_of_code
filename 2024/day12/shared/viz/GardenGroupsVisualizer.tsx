import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type GardenMap,
  type GardenTraceFrame,
  partitionGarden,
  type RegionFenceMetric,
  type RegionPartition,
} from '../index';
import { GardenCanvas } from './GardenCanvas';

export interface GardenGroupsVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<GardenMap, number, GardenTraceFrame>;
  readonly metric: RegionFenceMetric;
}

type VizState =
  | {
      readonly ok: true;
      readonly map: GardenMap;
      readonly partition: RegionPartition;
      readonly total: number;
      readonly frames: readonly GardenTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: PuzzleSolver<GardenMap, number, GardenTraceFrame>,
): VizState {
  try {
    const map = solver.parse(rawInput);
    const partition = partitionGarden(map);
    const total = solver.solve(map);
    const frames = solver.trace
      ? solver.trace(map, { maxSteps: DEFAULT_MAX_TRACE_STEPS })
      : [];
    return { ok: true, map, partition, total, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function GardenHud({
  map,
  frame,
  total,
  metric,
}: {
  readonly map: GardenMap;
  readonly frame: GardenTraceFrame | null;
  readonly total: number;
  readonly metric: RegionFenceMetric;
}) {
  if (!frame) {
    return (
      <div className="meta-row">
        <span className="badge">Grid: <code>{map.rows}×{map.cols}</code></span>
        <span className="badge status-solved">
          Final Total: <strong className="gold"><code>{total}</code></strong>
        </span>
      </div>
    );
  }
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">Grid: <code>{map.rows}×{map.cols}</code></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Region: <code>#{frame.regionOrder + 1}/{frame.totalRegions}</code>
      </span>
      <span className="badge">Plant: <code>{frame.plant}</code></span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Area <code>{frame.area}</code> × {metric.label} <code>{frame.metricValue}</code> ({metric.unit}) ={' '}
        <code>{frame.regionPrice}</code>
      </span>
      <span className="badge status-solved">
        Running Total: <strong className="gold"><code>{frame.runningTotal}</code></strong> / Final Total:{' '}
        <code>{total}</code>
      </span>
    </div>
  );
}

/** Shared interactive garden region visualizer parameterized by fence metric. */
export function GardenGroupsVisualizer({
  rawInput,
  solver,
  metric,
}: GardenGroupsVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${metric.id}`, 200);

  if (!state.ok) {
    return <p className="error-text">Unable to visualize input: {state.message}</p>;
  }

  const activeFrame = state.frames[playback.step] ?? null;

  return (
    <div>
      <GardenHud map={state.map} frame={activeFrame} total={state.total} metric={metric} />
      <div style={{ margin: '0.6rem 0' }}>
        <GardenCanvas map={state.map} partition={state.partition} frame={activeFrame} />
      </div>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span>Dimmed: unvisited regions</span>
        <span>·</span>
        <span>Tinted: priced regions</span>
        <span>·</span>
        <span>
          <strong style={{ color: 'var(--gold)' }}>Gold fence</strong>: exposed {metric.label.toLowerCase()} edges (outer &amp; interior holes)
        </span>
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
