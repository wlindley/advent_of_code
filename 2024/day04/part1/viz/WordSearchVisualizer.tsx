import { useEffect, useMemo, useRef } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import type { WordSearchGrid } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, findXmasMatches, solver, type WordMatch, type WordSearchTraceFrame } from '../domain';
import { formatDirection, renderWordSearchCanvas } from './canvasRenderer';

type ParsedVizState =
  | { readonly ok: true; readonly grid: WordSearchGrid; readonly matches: readonly WordMatch[]; readonly frames: readonly WordSearchTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVisualizerState(rawInput: string): ParsedVizState {
  try {
    const grid = solver.parse(rawInput);
    return { ok: true, grid, matches: findXmasMatches(grid), frames: solver.trace!(grid, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function StatusBadges({ grid, frame }: { readonly grid: WordSearchGrid; readonly frame: WordSearchTraceFrame }) {
  const active = frame.activeMatch;
  return (
    <div className="meta-row">
      <span className="badge">Grid: <code>{grid.rows}×{grid.cols}</code></span>
      <span className="badge status-solved">Found: <strong className="gold"><code>{frame.foundCount} / {frame.totalMatches}</code></strong></span>
      <span className="badge" style={{ borderColor: active ? 'var(--gold)' : 'var(--border)', color: active ? 'var(--gold)' : 'var(--muted)' }}>
        {active ? <>Active: <code>({active.row},{active.col}) → {formatDirection(active.dr, active.dc)}</code></> : 'No XMAS matches'}
      </span>
    </div>
  );
}

function VizFooter({ totalSteps, playback }: { readonly totalSteps: number; readonly playback: PlaybackState }) {
  return (
    <>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span><strong style={{ color: 'var(--gold)' }}>Gold ray</strong>: active XMAS (dot = X, tip = S)</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--ok)' }}>Emerald</strong>: discovered rays (darker = overlap)</span>
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

export function WordSearchVisualizer({ rawInput }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const state = useMemo(() => buildVisualizerState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 140);
  const frame = frames[playback.step] ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!state.ok || !frame || !canvas) return;
    renderWordSearchCanvas(canvas, state.grid, state.matches.slice(0, frame.foundCount), frame.activeMatch, Math.min(2, window.devicePixelRatio || 1));
  }, [state, frame]);

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  return (
    <div>
      <StatusBadges grid={state.grid} frame={frame} />
      <div style={{ margin: '0.6rem 0', overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          aria-label={`Word search ${state.grid.rows} by ${state.grid.cols} grid with ${frame.foundCount} of ${frame.totalMatches} XMAS matches highlighted`}
          style={{ display: 'block', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', maxWidth: '100%', height: 'auto' }}
        />
      </div>
      <VizFooter totalSteps={frames.length} playback={playback} />
    </div>
  );
}
