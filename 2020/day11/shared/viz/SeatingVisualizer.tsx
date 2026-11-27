import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  buildSeatGraph,
  DEFAULT_MAX_TRACE_STEPS,
  type SeatGraph,
  type SeatingLayout,
  type SeatingSystemSolver,
  type SeatingTraceFrame,
} from '../index';
import { SeatingCanvas } from './SeatingCanvas';

export interface SeatingVisualizerProps {
  readonly rawInput: string;
  readonly solver: SeatingSystemSolver;
}

type TraceState =
  | {
      readonly ok: true;
      readonly layout: SeatingLayout;
      readonly graph: SeatGraph;
      readonly frames: readonly SeatingTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildSeatingTrace(rawInput: string, solver: SeatingSystemSolver): TraceState {
  try {
    const layout = solver.parse(rawInput);
    const graph = buildSeatGraph(layout, solver.rule);
    const frames = solver.trace(layout, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, layout, graph, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBadges({
  solver,
  layout,
  frame,
}: {
  readonly solver: SeatingSystemSolver;
  readonly layout: SeatingLayout;
  readonly frame: SeatingTraceFrame;
}) {
  const statusClass = frame.isStable ? 'status-solved' : 'status-in_progress';
  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div className="meta-row">
        <span className="badge">{`${solver.rule.label} (>= ${solver.rule.crowdThreshold})`}</span>
        <span className="badge">{`${layout.rows}x${layout.cols} (${layout.seatCount} seats)`}</span>
        <span className={`badge ${statusClass}`}>
          {`Round ${frame.round} / ${frame.totalRounds}${frame.isStable ? ' · Stable' : ''}`}
        </span>
        <span className="badge">{`Occupied: ${frame.occupiedCount} | Empty: ${frame.emptyCount}`}</span>
        <span className="badge">{`+${frame.newlyOccupiedCount} / -${frame.newlyVacatedCount}`}</span>
      </div>
      <div className="meta-row">
        <span className="badge" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Empty (L)</span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Occupied (#)</span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Newly Occupied</span>
        <span className="badge" style={{ borderColor: 'var(--err)', color: 'var(--err)' }}>Newly Vacated</span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Inspected Rays</span>
      </div>
    </div>
  );
}

/** Shared interactive seating simulation visualizer for Day 11 parts. */
export function SeatingVisualizer({ rawInput, solver }: SeatingVisualizerProps) {
  const resetKey = `${solver.rule.id}:${rawInput}`;
  const state = useMemo(() => buildSeatingTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, resetKey, 140);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">{`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <TelemetryBadges solver={solver} layout={state.layout} frame={frame} />
      <SeatingCanvas layout={state.layout} graph={state.graph} frame={frame} resetKey={resetKey} />
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
