import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  computeChartBounds,
  DEFAULT_MAX_TRACE_STEPS,
  formatCompassCoords,
  type ChartBounds,
  type NavigationTraceFrame,
  type RainRiskSolver,
} from '../index';
import { NauticalChartSvg } from './NauticalChartSvg';

export interface NavigationVisualizerProps {
  readonly rawInput: string;
  readonly solver: RainRiskSolver;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly NavigationTraceFrame[]; readonly bounds: ChartBounds }
  | { readonly ok: false; readonly message: string };

function buildTrace(rawInput: string, solver: RainRiskSolver): TraceResult {
  try {
    const instructions = solver.parse(rawInput);
    const frames = solver.trace(instructions, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const bounds = computeChartBounds(frames);
    return { ok: true, frames, bounds };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function NavigationTelemetry({
  solver,
  frame,
}: {
  readonly solver: RainRiskSolver;
  readonly frame: NavigationTraceFrame;
}) {
  const statusClass = frame.isFinal ? 'status-solved' : 'status-in_progress';
  const stepLabel = frame.instruction ? frame.instruction.label : 'Start';
  return (
    <div className="meta-row">
      <span className="badge">{solver.rule.label}</span>
      <span className={`badge ${statusClass}`}>
        {`Step ${frame.stepIndex} / ${frame.totalSteps}${frame.isFinal ? ' · Final' : ''}`}
      </span>
      <span className="badge">{`Cmd: ${stepLabel}`}</span>
      <span className="badge">{`Ship: ${formatCompassCoords(frame.state.position)}`}</span>
      <span className="badge">{`${solver.rule.vectorLabel}: ${formatCompassCoords(frame.state.vector)}`}</span>
      <span className="badge">{`Manhattan: ${frame.state.manhattanDistance.toString()}`}</span>
    </div>
  );
}

/** Shared interactive nautical course visualizer for AoC 2020 Day 12. */
export function NavigationVisualizer({ rawInput, solver }: NavigationVisualizerProps) {
  const resetKey = `${solver.rule.id}:${rawInput}`;
  const state = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, resetKey, 80);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">
          {`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <NavigationTelemetry solver={solver} frame={frame} />
      <NauticalChartSvg
        frames={frames}
        bounds={state.bounds}
        activeIndex={playback.step}
        vectorLabel={solver.rule.vectorLabel}
      />
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
