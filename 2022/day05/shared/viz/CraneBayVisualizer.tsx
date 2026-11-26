import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import type { SupplyProcedure } from '../model';
import { DEFAULT_MAX_TRACE_STEPS, type CraneTraceFrame } from '../simulator';
import { CraneBaySvg } from './CraneBaySvg';

export interface CraneBayVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<SupplyProcedure, string, CraneTraceFrame>;
  readonly craneLabel: string;
  readonly craneMode: string;
  readonly accentColor: string;
}

interface TelemetryHeaderProps {
  readonly frame: CraneTraceFrame;
  readonly craneLabel: string;
  readonly craneMode: string;
  readonly accentColor: string;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly CraneTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceResult(
  rawInput: string,
  solver: PuzzleSolver<SupplyProcedure, string, CraneTraceFrame>,
): TraceResult {
  try {
    const procedure = solver.parse(rawInput);
    const frames = solver.trace?.(procedure, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    return { ok: true, frames };
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

function TelemetryHeader({ frame, craneLabel, craneMode, accentColor }: TelemetryHeaderProps) {
  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: accentColor, color: accentColor }}>{craneLabel} · {craneMode}</span>
      <span className="badge">Move: <code>{frame.moveIndex} / {frame.totalMoves}</code></span>
      <span className="badge">{frame.appliedMove ? <code>{frame.appliedMove.summary}</code> : 'Initial state'}</span>
      <span className="badge status-solved">Tops: <strong>{frame.topMessage || '—'}</strong></span>
      <span className="badge">Peak: <code>{frame.currentPeakHeight} / {frame.globalPeakHeight}</code></span>
      {frame.totalMoves + 1 > frame.totalSteps && (
        <span className="muted">Sampled {frame.totalSteps} of {frame.totalMoves + 1} states</span>
      )}
    </div>
  );
}

function LandedBatchStrip({ frame, accentColor }: { readonly frame: CraneTraceFrame; readonly accentColor: string }) {
  if (!frame.appliedMove || frame.placedCrates.length === 0) {
    return (
      <div className="muted" style={{ fontSize: '0.84rem', marginBottom: '0.45rem' }}>
        Initial stack layout — press Play or Next to step through crane moves.
      </div>
    );
  }
  return (
    <div className="meta-row" style={{ margin: '0.35rem 0 0.5rem' }}>
      <span className="muted" style={{ fontSize: '0.82rem' }}>
        Landed on stack {frame.appliedMove.to} (bottom → top):
      </span>
      {frame.placedCrates.map((crate, idx) => (
        <span key={idx} className="badge" style={{ borderColor: accentColor, color: 'var(--text)' }}>{crate.label}</span>
      ))}
    </div>
  );
}

export function CraneBayVisualizer({ rawInput, solver, craneLabel, craneMode, accentColor }: CraneBayVisualizerProps) {
  const state = useMemo(() => buildTraceResult(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 240);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  return (
    <div>
      <TelemetryHeader frame={frame} craneLabel={craneLabel} craneMode={craneMode} accentColor={accentColor} />
      <CraneBaySvg frame={frame} accentColor={accentColor} />
      <LandedBatchStrip frame={frame} accentColor={accentColor} />
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
