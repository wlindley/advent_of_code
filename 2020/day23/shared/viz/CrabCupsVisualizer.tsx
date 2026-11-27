import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type CrabCupsSolver,
  type CrabCupsTraceFrame,
} from '../index';
import { CrabCupsDiagram } from './CrabCupsDiagram';

export interface CrabCupsVisualizerProps {
  readonly rawInput: string;
  readonly solver: CrabCupsSolver;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly CrabCupsTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrace(rawInput: string, solver: CrabCupsSolver): TraceResult {
  try {
    const spec = solver.parse(rawInput);
    const frames = solver.trace(spec, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function CrabCupsTelemetry({ label, frame }: { readonly label: string; readonly frame: CrabCupsTraceFrame }) {
  const statusClass = frame.isFinal ? 'status-solved' : 'status-in_progress';
  const answerBadge = frame.labelsAfterOne !== null
    ? `After 1: ${frame.labelsAfterOne}`
    : `Star Product: ${frame.productAfterOne}`;
  return (
    <div className="meta-row">
      <span className="badge">{label}</span>
      <span className={`badge ${statusClass}`}>
        {`Move ${frame.move} / ${frame.totalMoves}${frame.isFinal ? ' · Final' : ''}`}
      </span>
      <span className="badge">{`Current Cup: ${frame.currentCup}`}</span>
      {frame.lastMove && (
        <span className="badge">{`Dest: ${frame.lastMove.destination}${frame.didWrap ? ' (wrap)' : ''}`}</span>
      )}
      <span className={`badge ${frame.isFinal ? 'status-solved' : ''}`}>{answerBadge}</span>
    </div>
  );
}

/** Shared interactive playback visualizer for AoC 2020 Day 23 Crab Cups. */
export function CrabCupsVisualizer({ rawInput, solver }: CrabCupsVisualizerProps) {
  const state = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 160);
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
      <CrabCupsTelemetry label={solver.policy.label} frame={frame} />
      <CrabCupsDiagram frame={frame} />
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
