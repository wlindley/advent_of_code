import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type CrossingMetric,
  type WirePair,
  type WireTraceFrame,
} from '../index';
import { WireCircuitCanvas } from './WireCircuitCanvas';

export interface CrossedWiresVisualizerProps {
  readonly rawInput: string;
  readonly metric: CrossingMetric;
  readonly solver: Required<PuzzleSolver<WirePair, bigint, WireTraceFrame>>;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly WireTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(
  rawInput: string,
  solver: Required<PuzzleSolver<WirePair, bigint, WireTraceFrame>>,
): TraceState {
  try {
    const pair = solver.parse(rawInput);
    const frames = solver.trace(pair, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBar({
  frame,
  metric,
  sampledCount,
}: {
  readonly frame: WireTraceFrame;
  readonly metric: CrossingMetric;
  readonly sampledCount: number;
}) {
  const best = frame.bestCrossing;
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">
        Step {frame.stepIndex + 1} / {frame.totalSteps}
      </span>
      <span className="badge">
        Wire 1: {frame.firstVisibleCount}/{frame.pair.first.length}
      </span>
      <span className="badge">
        Wire 2: {frame.secondVisibleCount}/{frame.pair.second.length}
      </span>
      <span className="badge">Crossings: {frame.discoveredCrossings.length}</span>
      {best !== null ? (
        <span className="badge status-solved">
          Best {metric.name}: {metric.score(best).toString()} at ({best.point.x.toString()},{' '}
          {best.point.y.toString()})
        </span>
      ) : (
        <span className="badge">Best {metric.name}: none yet</span>
      )}
      {frame.totalSteps > sampledCount && (
        <span className="muted">
          Sampled {sampledCount} of {frame.totalSteps} steps
        </span>
      )}
    </div>
  );
}

/** Interactive Crossed Wires visualizer shared across Day 3 Parts 1 and 2. */
export function CrossedWiresVisualizer({
  rawInput,
  metric,
  solver,
}: CrossedWiresVisualizerProps) {
  const traceState = useMemo(() => buildTraceState(rawInput, solver), [rawInput, solver]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 120);

  if (!traceState.ok || frames.length === 0) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize input: {traceState.ok ? 'No trace frames available' : traceState.message}
        </p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  return (
    <div className="stack">
      <TelemetryBar frame={frame} metric={metric} sampledCount={frames.length} />
      <WireCircuitCanvas frame={frame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
