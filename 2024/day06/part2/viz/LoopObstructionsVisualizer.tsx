import { useEffect, useMemo, useRef } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import type { CellCoord, LabMap } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, findLoopObstructions, solver, type LoopCandidateFrame } from '../domain';
import { renderLoopObstructionsCanvas } from './canvasRenderer';

type ParsedVizState =
  | { readonly ok: true; readonly map: LabMap; readonly obstructions: readonly CellCoord[]; readonly frames: readonly LoopCandidateFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVisualizerState(rawInput: string): ParsedVizState {
  try {
    const map = solver.parse(rawInput);
    const obstructions = findLoopObstructions(map);
    const frames = solver.trace!(map, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, map, obstructions, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function StatusBadges({ map, total, frame }: { readonly map: LabMap; readonly total: number; readonly frame: LoopCandidateFrame | null }) {
  return (
    <div className="meta-row">
      <span className="badge">Map: <code>{map.rows}×{map.cols}</code></span>
      <span className={`badge ${total > 0 ? 'status-solved' : ''}`}>
        Loop Obstructions: <strong className="gold"><code>{total}</code></strong>
      </span>
      <span className="badge">
        Showing: <code>{frame ? `${frame.candidateIndex + 1} / ${frame.totalCandidates}` : '0 / 0'}</code>
      </span>
      <span className="badge" style={{ borderColor: 'var(--err)', color: 'var(--err)' }}>
        Obstacle: <code>{frame ? `(${frame.obstruction.row},${frame.obstruction.col})` : 'none'}</code>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Cycle: <code>{frame ? `${frame.cycleSteps} steps / ${frame.cycleTurns} turns` : '0 steps'}</code>
      </span>
    </div>
  );
}

function VizFooter({ totalSteps, playback }: { readonly totalSteps: number; readonly playback: PlaybackState }) {
  return (
    <>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span><strong style={{ color: 'var(--err)' }}>Crimson pin / solid loop</strong>: active obstacle &amp; cycle</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--accent)' }}>Dashed blue</strong>: approach path</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--gold)' }}>Gold ring / amber dots</strong>: start &amp; turns</span>
      </div>
      {totalSteps === 0 ? (
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.88rem', color: 'var(--muted)' }}>
          No loop-inducing obstacle placements exist for this lab floorplan.
        </p>
      ) : (
        <PlaybackControls
          step={playback.step} totalSteps={totalSteps} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
          onTogglePlay={() => { if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0); playback.togglePlay(); }}
          onStepChange={(next) => { if (playback.isPlaying) playback.togglePlay(); playback.setStep(next); }}
          onSpeedChange={playback.setSpeedMs}
        />
      )}
    </>
  );
}

export function LoopObstructionsVisualizer({ rawInput }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const state = useMemo(() => buildVisualizerState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 250);
  const activeFrame = frames[playback.step] ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!state.ok || !canvas) return;
    renderLoopObstructionsCanvas(canvas, state.map, state.obstructions, activeFrame, Math.min(2, window.devicePixelRatio || 1));
  }, [state, activeFrame]);

  if (!state.ok) {
    return <p className="error-text">Unable to visualize input: {state.message}</p>;
  }
  return (
    <div style={{ color: 'var(--text)' }}>
      <StatusBadges map={state.map} total={state.obstructions.length} frame={activeFrame} />
      <div style={{ margin: '0.6rem 0', overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          aria-label={`Lab ${state.map.rows} by ${state.map.cols} grid with ${state.obstructions.length} loop obstructions`}
          style={{ display: 'block', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', maxWidth: '100%', height: 'auto' }}
        />
      </div>
      <VizFooter totalSteps={frames.length} playback={playback} />
    </div>
  );
}
