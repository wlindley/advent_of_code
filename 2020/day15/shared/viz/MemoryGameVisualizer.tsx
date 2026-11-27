import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type MemoryGameSolver,
  type MemoryGameTraceFrame,
} from '../index';
import { GrowthStatsPanel } from './GrowthStatsPanel';
import { TurnArcTimelineSvg } from './TurnArcTimelineSvg';

export interface MemoryGameVisualizerProps {
  readonly rawInput: string;
  readonly solver: MemoryGameSolver;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly MemoryGameTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrace(rawInput: string, solver: MemoryGameSolver): TraceResult {
  try {
    const seq = solver.parse(rawInput);
    const frames = solver.trace(seq, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function MemoryGameTelemetry({
  solver,
  frame,
}: {
  readonly solver: MemoryGameSolver;
  readonly frame: MemoryGameTraceFrame;
}) {
  const statusClass = frame.isFinal ? 'status-solved' : 'status-in_progress';
  return (
    <div className="meta-row">
      <span className="badge">{`Target: T${solver.targetTurn}`}</span>
      <span className={`badge ${statusClass}`}>
        {`Turn ${frame.turn} / ${frame.traceHorizon}${frame.isFinal ? ' · Final' : ''}`}
      </span>
      <span className="badge">{`Spoken: ${frame.spoken}`}</span>
      {frame.isHorizonTruncated && (
        <span className="badge status-in_progress">{`Trace capped at T${frame.traceHorizon}`}</span>
      )}
    </div>
  );
}

/** Shared interactive sliding-window & trajectory visualizer for AoC 2020 Day 15. */
export function MemoryGameVisualizer({ rawInput, solver }: MemoryGameVisualizerProps) {
  const state = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.targetTurn}:${rawInput}`, 180);
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
      <MemoryGameTelemetry solver={solver} frame={frame} />
      <TurnArcTimelineSvg frame={frame} />
      <GrowthStatsPanel frames={frames} currentIndex={playback.step} frame={frame} />
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
