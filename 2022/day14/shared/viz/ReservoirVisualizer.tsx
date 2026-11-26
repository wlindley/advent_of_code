import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import {
  buildReservoirTrace,
  type CaveBoundaryPolicy,
  type CaveScan,
  DEFAULT_MAX_TRACE_STEPS,
  type ReservoirField,
  type ReservoirPhase,
  type ReservoirTraceFrame,
  simulateReservoir,
} from '../index';
import { ReservoirCanvas } from './ReservoirCanvas';

export interface ReservoirVisualizerProps {
  readonly rawInput: string;
  readonly policy: CaveBoundaryPolicy;
  readonly solver: PuzzleSolver<CaveScan, number, ReservoirTraceFrame>;
}

type VizState =
  | {
      readonly ok: true;
      readonly field: ReservoirField;
      readonly frames: readonly ReservoirTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  policy: CaveBoundaryPolicy,
  solver: PuzzleSolver<CaveScan, number, ReservoirTraceFrame>,
): VizState {
  try {
    const scan = solver.parse(rawInput);
    const field = simulateReservoir(scan, policy);
    const frames = solver.trace?.(scan, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ??
      buildReservoirTrace(field, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, field, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function phaseLabel(phase: ReservoirPhase): string {
  if (phase === 'escaped') return 'Escaped into abyss';
  if (phase === 'blocked') return 'Source blocked';
  return 'Pouring';
}

function phaseClass(phase: ReservoirPhase): string {
  if (phase === 'pouring') return '';
  return 'status-solved';
}

function KpiBadges({ field, frame, policy, frameCount }: {
  readonly field: ReservoirField;
  readonly frame: ReservoirTraceFrame;
  readonly policy: CaveBoundaryPolicy;
  readonly frameCount: number;
}) {
  const { bounds } = field;
  const totalUncompressed = field.settledCount + (field.escaped ? 2 : 1);
  return (
    <div className="meta-row" style={{ marginBottom: '0.6rem' }}>
      <span className="badge">Cave: <code>{bounds.width}×{bounds.height}</code></span>
      <span className="badge">Mode: <code>{policy.label}</code></span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Settled: <code>{frame.settledCount} / {frame.totalSettled}</code>
      </span>
      <span className={`badge ${phaseClass(frame.phase)}`}>
        Status: <strong>{phaseLabel(frame.phase)}</strong>
      </span>
      {frameCount < totalUncompressed && (
        <span className="muted">Sampled {frameCount} of {totalUncompressed} frames</span>
      )}
    </div>
  );
}

/** Interactive cave cross-section sand-pouring playback visualizer. */
export function ReservoirVisualizer({ rawInput, policy, solver }: ReservoirVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, policy, solver), [rawInput, policy, solver]);
  const frameCount = state.ok ? state.frames.length : 0;
  const playback = usePlayback(frameCount, rawInput, 100);

  if (!state.ok) return <p className="error-text">Cannot visualize input: {state.message}</p>;
  const frame = state.frames[playback.step];
  if (!frame) return <p className="muted">No trace frames available.</p>;

  return (
    <div>
      <PlaybackControls
        step={playback.step}
        totalSteps={frameCount}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frameCount - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
      <KpiBadges field={state.field} frame={frame} policy={policy} frameCount={frameCount} />
      <ReservoirCanvas field={state.field} frame={frame} />
    </div>
  );
}
