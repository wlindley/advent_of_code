import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  VaultSolver,
  buildKeyRingBadges,
  computeVaultRenderMetrics,
  type VaultPolicy,
  type VaultTraceFrame,
} from '../index';
import { VaultCanvas } from './VaultCanvas';

interface VaultVisualizerProps {
  readonly rawInput: string;
  readonly solver: VaultSolver;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly VaultTraceFrame[]; readonly finalAnswer: number }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, solver: VaultSolver): VizState {
  try {
    const frames = solver.trace(solver.parse(rawInput), { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames, finalAnswer: frames[frames.length - 1]!.totalSteps };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function VaultHud({ policy, frame, finalAnswer }: { readonly policy: VaultPolicy; readonly frame: VaultTraceFrame; readonly finalAnswer: number }) {
  const badges = buildKeyRingBadges(frame.map, frame.collectedMask);
  return (
    <>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">{policy.label}</span>
        <span className="badge">Step {frame.stepIndex} / {frame.totalSteps}</span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Answer: {finalAnswer}</span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Key</span>
        <span className="badge" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }}>Locked Door</span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Trail</span>
      </div>
      <div className="meta-row" style={{ margin: 0, gap: '0.3rem' }}>
        {badges.map((b) => (
          <span key={b.letter} className="badge" style={{ borderColor: b.collected ? 'var(--ok)' : 'var(--border)', color: b.collected ? 'var(--ok)' : 'var(--muted)' }}>
            {b.letter}
          </span>
        ))}
      </div>
    </>
  );
}

/** Interactive HiDPI canvas visualizer for AoC 2019 Day 18 Parts 1 and 2. */
export function VaultVisualizer({ rawInput, solver }: VaultVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 45);
  if (!state.ok) return <div className="stack"><p className="error-text">Unable to visualize input: {state.message}</p></div>;

  const frame = frames[playback.step]!;
  return (
    <div className="stack">
      <VaultHud policy={solver.policy} frame={frame} finalAnswer={state.finalAnswer} />
      <VaultCanvas frame={frame} metrics={computeVaultRenderMetrics(frame.map.rows, frame.map.cols)} />
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
