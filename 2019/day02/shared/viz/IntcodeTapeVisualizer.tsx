import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import type { IntcodeProgram } from '../../../shared/intcode';
import {
  DEFAULT_MAX_TRACE_STEPS,
  formatInstructionSummary,
  type AlarmTraceFrame,
  type GravityAssistInputs,
} from '../index';
import { TapeGridPanel } from './TapeGridPanel';

interface IntcodeTapeVisualizerProps {
  readonly rawInput: string;
  readonly inputs: GravityAssistInputs;
  readonly solver: Required<PuzzleSolver<IntcodeProgram, bigint, AlarmTraceFrame>>;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly AlarmTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(
  rawInput: string,
  solver: Required<PuzzleSolver<IntcodeProgram, bigint, AlarmTraceFrame>>,
): TraceState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryRow({
  frame,
  inputs,
  sampledCount,
}: {
  readonly frame: AlarmTraceFrame;
  readonly inputs: GravityAssistInputs;
  readonly sampledCount: number;
}) {
  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">Noun: {inputs.noun.toString()}</span>
        <span className="badge">Verb: {inputs.verb.toString()}</span>
        <span className="badge">
          Step {frame.step.stepIndex + 1} / {frame.totalSteps}
        </span>
        <span className="badge">IP: {frame.step.ipBefore.toString()}</span>
        <span className="badge status-solved">mem[0]: {frame.memory[0]!.toString()}</span>
        {frame.totalSteps > sampledCount && (
          <span className="muted">Sampled {sampledCount} of {frame.totalSteps} steps</span>
        )}
      </div>
      <div className="card" style={{ marginBottom: 0, padding: '0.65rem 0.9rem' }}>
        <code>{formatInstructionSummary(frame.step)}</code>
      </div>
    </div>
  );
}

/** Interactive Intcode memory-tape step visualizer for AoC 2019 Day 2. */
export function IntcodeTapeVisualizer({ rawInput, inputs, solver }: IntcodeTapeVisualizerProps) {
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
      <TelemetryRow frame={frame} inputs={inputs} sampledCount={frames.length} />
      <TapeGridPanel frame={frame} />
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
