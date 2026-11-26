import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls } from '../../../../shared/viz/PlaybackControls';
import { usePlayback, type PlaybackState } from '../../../../shared/viz/usePlayback';
import type { WastelandNetwork } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type GhostConvergenceFrame,
  type GhostCycle,
} from '../domain';
import { GhostRhoTrack, type GhostTrackStatus } from './GhostRhoTrack';
import { LockstepStrip } from './LockstepStrip';

export interface GhostConvergenceVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<WastelandNetwork, bigint, GhostConvergenceFrame>;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly GhostConvergenceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrace(
  rawInput: string,
  solver: PuzzleSolver<WastelandNetwork, bigint, GhostConvergenceFrame>,
): TraceResult {
  try {
    const network = solver.parse(rawInput);
    const frames = solver.trace!(network, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function ghostStatusFor(frame: GhostConvergenceFrame, cycle: GhostCycle): GhostTrackStatus {
  if (frame.isConverged) return 'synced';
  if (frame.stage === 'discovery') return 'pending';
  const activeIdx = frame.mergeStep!.ghostIndex;
  const cycleIdx = frame.plan.cycles.indexOf(cycle);
  if (cycleIdx < activeIdx) return 'synced';
  return cycleIdx === activeIdx ? 'active' : 'pending';
}

function renderKpiHeader(frame: GhostConvergenceFrame) {
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">Stage: <strong>{frame.stage}</strong></span>
      <span className="badge">Regime: <strong>{frame.plan.regime}</strong></span>
      <span className="badge">Ghosts: <strong>{frame.ghostCount}</strong></span>
      <span className="badge">Max μ: <strong>{frame.maxPrefixLength}</strong></span>
      <span className="badge" style={{ borderColor: frame.isConverged ? 'var(--ok)' : 'var(--accent)' }}>
        Step: <strong>{frame.runningStep.toString()}</strong>
      </span>
      <span className="badge">Modulus: <strong className="gold">{frame.runningModulus.toString()}</strong></span>
    </div>
  );
}

function renderScaleBar(frame: GhostConvergenceFrame) {
  const pct = Math.min(100, Math.max(0, frame.log2ScaleRatio * 100));
  return (
    <div style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text)', marginBottom: '0.35rem' }}>
        <span>Log₂ Convergence Scale</span>
        <strong>{pct.toFixed(1)}%</strong>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: frame.isConverged ? 'var(--ok)' : 'var(--accent)', transition: 'width 160ms ease' }} />
      </div>
    </div>
  );
}

function renderFrontierSummary(frame: GhostConvergenceFrame) {
  const stepRecord = frame.mergeStep ?? frame.plan.mergeSteps.at(-1);
  if (!stepRecord) return null;
  const shown = stepRecord.congruences.slice(0, 6);
  const extra = stepRecord.congruences.length - shown.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>Frontier:</span>
      {shown.map((c) => (
        <span key={c.key} className="badge" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.74rem' }}>
          {c.toString()}
        </span>
      ))}
      {extra > 0 && <span className="muted" style={{ fontSize: '0.75rem' }}>+{extra} more</span>}
      {frame.mergeStep && frame.mergeStep.prunedCount > 0 && (
        <span className="muted" style={{ fontSize: '0.75rem' }}>({frame.mergeStep.prunedCount} pruned)</span>
      )}
    </div>
  );
}

export function GhostConvergenceVisualizer({ rawInput, solver }: GhostConvergenceVisualizerProps) {
  const trace = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = trace.ok ? trace.frames : [];
  const playback = usePlayback(frames.length, rawInput, 420);
  const activeFrame = frames[playback.step];

  if (!trace.ok) return <p className="error-text">Unable to visualize input: {trace.message}</p>;
  if (!activeFrame) return <p className="muted">No ghost convergence steps to visualize.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {renderKpiHeader(activeFrame)}
      {renderScaleBar(activeFrame)}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {activeFrame.plan.cycles.map((cycle) => (
          <GhostRhoTrack
            key={cycle.startId}
            cycle={cycle}
            status={ghostStatusFor(activeFrame, cycle)}
            isConverged={activeFrame.isConverged}
          />
        ))}
      </div>
      {activeFrame.stage !== 'discovery' && renderFrontierSummary(activeFrame)}
      <LockstepStrip frame={activeFrame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, frames.length)}
        onStepChange={(next) => selectStep(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
