import { useEffect, useMemo, useRef } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { GUARD_SYMBOLS, simulatePatrol, type LabMap, type PatrolStep } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, type GuardTraceFrame } from '../domain';
import { renderGuardPatrolCanvas } from './canvasRenderer';

type ParsedVizState =
  | { readonly ok: true; readonly map: LabMap; readonly steps: readonly PatrolStep[]; readonly frames: readonly GuardTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVisualizerState(rawInput: string): ParsedVizState {
  try {
    const map = solver.parse(rawInput);
    const patrol = simulatePatrol(map, { recordSteps: true });
    return { ok: true, map, steps: patrol.steps, frames: solver.trace!(map, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function StatusBadges({ map, frame }: { readonly map: LabMap; readonly frame: GuardTraceFrame }) {
  const { step } = frame;
  const isExited = frame.outcome === 'exited';
  return (
    <div className="meta-row">
      <span className="badge">Map: <code>{map.rows}×{map.cols}</code></span>
      <span className={`badge ${isExited ? 'status-solved' : ''}`}>Visited: <strong className="gold"><code>{frame.visitedCount}</code></strong></span>
      <span className="badge">Turns: <code>{frame.turnCount}</code></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Pose: <code>({step.row},{step.col}) {GUARD_SYMBOLS[step.dir]}</code>
      </span>
      <span className="badge" style={{ borderColor: isExited ? 'var(--ok)' : 'var(--gold)', color: isExited ? 'var(--ok)' : 'var(--gold)' }}>
        Outcome: <code>{frame.outcome}</code>
      </span>
    </div>
  );
}

function VizFooter({ totalSteps, playback }: { readonly totalSteps: number; readonly playback: PlaybackState }) {
  return (
    <>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span><strong style={{ color: 'var(--accent)' }}>Blue chevron</strong>: guard</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--gold)' }}>Gold ring / amber dots</strong>: start &amp; turns</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--ok)' }}>Emerald</strong>: visited trail (darker = 2+ passes)</span>
      </div>
      <PlaybackControls
        step={playback.step} totalSteps={totalSteps} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => { if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0); playback.togglePlay(); }}
        onStepChange={(next) => { if (playback.isPlaying) playback.togglePlay(); playback.setStep(next); }}
        onSpeedChange={playback.setSpeedMs}
      />
    </>
  );
}

export function GuardPatrolVisualizer({ rawInput }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const state = useMemo(() => buildVisualizerState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 120);
  const frame = frames[playback.step] ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!state.ok || !frame || !canvas) return;
    renderGuardPatrolCanvas(canvas, state.map, state.steps, frame.stepIndex, Math.min(2, window.devicePixelRatio || 1));
  }, [state, frame]);

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  return (
    <div>
      <StatusBadges map={state.map} frame={frame} />
      <div style={{ margin: '0.6rem 0', overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          aria-label={`Lab ${state.map.rows} by ${state.map.cols} grid with ${frame.visitedCount} visited cells`}
          style={{ display: 'block', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', maxWidth: '100%', height: 'auto' }}
        />
      </div>
      <VizFooter totalSteps={frames.length} playback={playback} />
    </div>
  );
}
