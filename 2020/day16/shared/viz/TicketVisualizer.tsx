import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type TicketTraceFrame,
  type TicketTranslationSolver,
} from '../index';
import { PeelingMatrixSvg } from './PeelingMatrixSvg';
import { SpectrumScannerSvg } from './SpectrumScannerSvg';

export interface TicketVisualizerProps<TTrace extends TicketTraceFrame> {
  readonly rawInput: string;
  readonly solver: TicketTranslationSolver<TTrace>;
}

type TraceResult<TTrace> =
  | { readonly ok: true; readonly frames: readonly TTrace[] }
  | { readonly ok: false; readonly message: string };

function buildTrace<TTrace extends TicketTraceFrame>(
  rawInput: string,
  solver: TicketTranslationSolver<TTrace>,
): TraceResult<TTrace> {
  try {
    const doc = solver.parse(rawInput);
    return { ok: true, frames: solver.trace(doc, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TicketTelemetry({ label, frame }: { readonly label: string; readonly frame: TicketTraceFrame }) {
  const statusClass = frame.isFinal ? 'status-solved' : 'status-in_progress';
  if (frame.kind === 'error-scan') {
    return (
      <div className="meta-row">
        <span className="badge">{label}</span>
        <span className={`badge ${statusClass}`}>{`Ticket ${frame.scannedCount} / ${frame.totalTickets}${frame.isFinal ? ' · Final' : ''}`}</span>
        <span className="badge">{`Invalid tickets: ${frame.invalidTicketCount}`}</span>
        <span className="badge">{`Error rate: ${frame.runningErrorRate}`}</span>
      </div>
    );
  }
  return (
    <div className="meta-row">
      <span className="badge">{label}</span>
      <span className={`badge ${statusClass}`}>{`Round ${frame.round} / ${frame.totalRounds}${frame.isFinal ? ' · Final' : ''}`}</span>
      <span className="badge">{`Locked departure: ${frame.lockedDepartureCount}`}</span>
      <span className="badge">{`Departure product: ${frame.departureProduct}`}</span>
    </div>
  );
}

/** Shared interactive visualizer for AoC 2020 Day 16 Part 1 and Part 2. */
export function TicketVisualizer<TTrace extends TicketTraceFrame>({
  rawInput,
  solver,
}: TicketVisualizerProps<TTrace>) {
  const state = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 180);
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
      <TicketTelemetry label={solver.policy.label} frame={frame} />
      {frame.kind === 'error-scan' ? <SpectrumScannerSvg frame={frame} /> : <PeelingMatrixSvg frame={frame} />}
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
