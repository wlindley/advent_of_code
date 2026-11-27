import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  formatInstructionLabel,
  type DockingSolver,
  type DockingTraceFrame,
} from '../index';
import { BitmaskGateSvg } from './BitmaskGateSvg';
import { MemoryLedgerPanels } from './MemoryLedgerPanels';

export interface DockingVisualizerProps {
  readonly rawInput: string;
  readonly solver: DockingSolver;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly DockingTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrace(rawInput: string, solver: DockingSolver): TraceResult {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function DockingTelemetry({ solver, frame }: { readonly solver: DockingSolver; readonly frame: DockingTraceFrame }) {
  const statusClass = frame.isFinal ? 'status-solved' : 'status-in_progress';
  return (
    <div className="meta-row">
      <span className="badge">{solver.policy.label}</span>
      <span className={`badge ${statusClass}`}>
        {`Step ${frame.step} / ${frame.totalInstructions}${frame.isFinal ? ' · Final' : ''}`}
      </span>
      <span className="badge">{formatInstructionLabel(frame.instruction)}</span>
      <span className="badge">{`Non-zero: ${frame.nonZeroCount}`}</span>
      <span className={`badge ${frame.isFinal ? 'status-solved' : ''}`}>{`Sum: ${frame.memorySum}`}</span>
    </div>
  );
}

/** Shared interactive bitmask & memory ledger visualizer for AoC 2020 Day 14. */
export function DockingVisualizer({ rawInput, solver }: DockingVisualizerProps) {
  const state = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 260);
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
      <DockingTelemetry solver={solver} frame={frame} />
      <BitmaskGateSvg frame={frame} />
      <MemoryLedgerPanels frame={frame} />
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
