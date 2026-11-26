import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  BoostSolver,
  DEFAULT_MAX_TRACE_STEPS,
  formatBoostStepSummary,
  type BoostTraceFrame,
} from '../index';
import { OutputStreamPanel } from './OutputStreamPanel';
import { RegisterDisassemblyPanel } from './RegisterDisassemblyPanel';
import { SparseMemoryPanel } from './SparseMemoryPanel';

interface BoostVisualizerProps {
  readonly rawInput: string;
  readonly solver: BoostSolver;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly BoostTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(rawInput: string, solver: BoostSolver): TraceState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive complete-Intcode debugger for AoC 2019 Day 9 (Sensor Boost). */
export function BoostVisualizer({ rawInput, solver }: BoostVisualizerProps) {
  const traceState = useMemo(() => buildTraceState(rawInput, solver), [rawInput, solver]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, `${solver.mode.id}:${rawInput}`, 240);

  if (!traceState.ok || frames.length === 0) {
    const message = traceState.ok ? 'No execution frames captured' : traceState.message;
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  return (
    <div className="stack">
      <div className="stack" style={{ gap: '0.45rem' }}>
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge">{solver.mode.label}</span>
          <span className="badge">Step {frame.step.stepIndex + 1} / {frame.totalSteps}</span>
          <span className="badge">IP: {frame.step.ipBefore.toString()}</span>
          <span className="badge">RB: {frame.relativeBaseAfter.toString()}</span>
          <span className="badge">Sparse: {frame.sparseEntries.length}</span>
          {frame.totalSteps > frames.length && (
            <span className="muted">Sampled {frames.length} of {frame.totalSteps} steps</span>
          )}
        </div>
        <div className="card" style={{ marginBottom: 0, padding: '0.65rem 0.9rem' }}>
          <code>{formatBoostStepSummary(frame)}</code>
        </div>
      </div>
      <RegisterDisassemblyPanel frame={frame} />
      <OutputStreamPanel frame={frame} mode={solver.mode} />
      <SparseMemoryPanel frame={frame} />
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
