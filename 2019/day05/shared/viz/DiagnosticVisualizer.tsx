import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import type { IntcodeProgram } from '../../../shared/intcode';
import {
  DEFAULT_MAX_TRACE_STEPS,
  formatDiagnosticStepSummary,
  type DiagnosticTraceFrame,
} from '../index';
import { IoStreamPanel } from './IoStreamPanel';
import { MemoryWindowPanel } from './MemoryWindowPanel';

interface DiagnosticVisualizerProps {
  readonly rawInput: string;
  readonly systemId: bigint;
  readonly solver: Required<PuzzleSolver<IntcodeProgram, bigint, DiagnosticTraceFrame>>;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly DiagnosticTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(
  rawInput: string,
  solver: Required<PuzzleSolver<IntcodeProgram, bigint, DiagnosticTraceFrame>>,
): TraceState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryHeader({
  frame,
  systemId,
  sampledCount,
}: {
  readonly frame: DiagnosticTraceFrame;
  readonly systemId: bigint;
  readonly sampledCount: number;
}) {
  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">System ID: {systemId.toString()}</span>
        <span className="badge">
          Step {frame.step.stepIndex + 1} / {frame.totalSteps}
        </span>
        <span className="badge">IP: {frame.step.ipBefore.toString()}</span>
        <span className="badge">Raw: {frame.step.rawInstruction.toString()}</span>
        {frame.totalSteps > sampledCount && (
          <span className="muted">Sampled {sampledCount} of {frame.totalSteps} steps</span>
        )}
      </div>
      <div className="card" style={{ marginBottom: 0, padding: '0.65rem 0.9rem' }}>
        <code>{formatDiagnosticStepSummary(frame.step)}</code>
      </div>
    </div>
  );
}

/** Interactive TEST diagnostic Intcode VM debugger for AoC 2019 Day 5. */
export function DiagnosticVisualizer({ rawInput, systemId, solver }: DiagnosticVisualizerProps) {
  const traceState = useMemo(() => buildTraceState(rawInput, solver), [rawInput, solver]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);

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
      <TelemetryHeader frame={frame} systemId={systemId} sampledCount={frames.length} />
      <IoStreamPanel frame={frame} systemId={systemId} />
      <MemoryWindowPanel frame={frame} />
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
