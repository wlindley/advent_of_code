import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_FRAMES,
  type AmplifierCircuitSolver,
  type AmplifierTraceFrame,
} from '../index';
import { AmplifierChainSvg } from './AmplifierChainSvg';
import { LeaderboardPanel } from './LeaderboardPanel';

interface AmplifierVisualizerProps {
  readonly rawInput: string;
  readonly solver: AmplifierCircuitSolver;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly AmplifierTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(rawInput: string, solver: AmplifierCircuitSolver): TraceState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_FRAMES });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive phase-permutation and amplifier schematic visualizer for AoC 2019 Day 7. */
export function AmplifierVisualizer({ rawInput, solver }: AmplifierVisualizerProps) {
  const traceState = useMemo(() => buildTraceState(rawInput, solver), [rawInput, solver]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, `${solver.mode.id}:${rawInput}`, 200);

  if (!traceState.ok) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {traceState.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  return (
    <div className="stack">
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">{solver.mode.name}</span>
        <span className="badge">Sampled {frames.length} frames</span>
      </div>
      <AmplifierChainSvg frame={frame} hasFeedbackLoop={solver.mode.hasFeedbackLoop} />
      <LeaderboardPanel frame={frame} />
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
