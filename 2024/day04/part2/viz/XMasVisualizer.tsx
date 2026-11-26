import { useEffect, useMemo, useRef, useState } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import type { WordSearchGrid } from '../../shared';
import {
  countByOrientation,
  DEFAULT_MAX_TRACE_STEPS,
  findXMasCrosses,
  solver,
  XMAS_ORIENTATIONS,
  type XMasCross,
  type XMasTraceFrame,
} from '../domain';
import { ORIENTATION_STYLES, renderXMasCanvas } from './canvasRenderer';

type ParsedVizState =
  | { readonly ok: true; readonly grid: WordSearchGrid; readonly crosses: readonly XMasCross[]; readonly frames: readonly XMasTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVisualizerState(rawInput: string): ParsedVizState {
  try {
    const grid = solver.parse(rawInput);
    return {
      ok: true,
      grid,
      crosses: findXMasCrosses(grid),
      frames: solver.trace!(grid, { maxSteps: DEFAULT_MAX_TRACE_STEPS }),
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function StatusBadges({
  grid, frame, maskUnused, onToggleMask,
}: {
  readonly grid: WordSearchGrid; readonly frame: XMasTraceFrame; readonly maskUnused: boolean; readonly onToggleMask: (next: boolean) => void;
}) {
  const active = frame.activeCross;
  return (
    <div className="meta-row">
      <span className="badge">Grid: <code>{grid.rows}×{grid.cols}</code></span>
      <span className="badge status-solved">Found: <strong className="gold"><code>{frame.foundCount} / {frame.totalCrosses}</code></strong></span>
      <span className="badge" style={{ borderColor: active ? 'var(--gold)' : 'var(--border)', color: active ? 'var(--gold)' : 'var(--muted)' }}>
        {active ? <>Active: <code>({active.centerRow},{active.centerCol}) · {ORIENTATION_STYLES[active.orientation].label}</code></> : 'No X-MAS crosses'}
      </span>
      <label className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--text)' }}>
        <input type="checkbox" checked={maskUnused} onChange={(e) => onToggleMask(e.target.checked)} />
        Mask unused cells
      </label>
    </div>
  );
}

function OrientationLegend({ discovered }: { readonly discovered: readonly XMasCross[] }) {
  const counts = countByOrientation(discovered);
  return (
    <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
      {XMAS_ORIENTATIONS.map((orientation) => {
        const style = ORIENTATION_STYLES[orientation];
        return (
          <span key={orientation} className="badge" style={{ borderColor: style.stroke, color: style.stroke }}>
            {style.label}: <code>{counts[orientation]}</code>
          </span>
        );
      })}
      <span><strong style={{ color: 'var(--gold)' }}>Gold</strong>: active (dot = M, ring = A)</span>
    </div>
  );
}

function VizFooter({ totalSteps, playback }: { readonly totalSteps: number; readonly playback: PlaybackState }) {
  return (
    <PlaybackControls
      step={playback.step} totalSteps={totalSteps} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
      onTogglePlay={() => { if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0); playback.togglePlay(); }}
      onStepChange={(next) => { if (playback.isPlaying) playback.togglePlay(); playback.setStep(next); }}
      onSpeedChange={playback.setSpeedMs}
    />
  );
}

export function XMasVisualizer({ rawInput }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const state = useMemo(() => buildVisualizerState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 140);
  const [maskUnused, setMaskUnused] = useState(false);
  const frame = frames[playback.step] ?? null;
  const discovered = useMemo(
    () => (state.ok && frame ? state.crosses.slice(0, frame.foundCount) : []),
    [state, frame],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!state.ok || !frame || !canvas) return;
    renderXMasCanvas(canvas, state.grid, discovered, frame.activeCross, maskUnused, Math.min(2, window.devicePixelRatio || 1));
  }, [state, frame, discovered, maskUnused]);

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  return (
    <div>
      <StatusBadges grid={state.grid} frame={frame} maskUnused={maskUnused} onToggleMask={setMaskUnused} />
      <div style={{ margin: '0.6rem 0', overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          aria-label={`X-MAS search ${state.grid.rows} by ${state.grid.cols} grid with ${frame.foundCount} of ${frame.totalCrosses} crosses highlighted`}
          style={{ display: 'block', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', maxWidth: '100%', height: 'auto' }}
        />
      </div>
      <OrientationLegend discovered={discovered} />
      <VizFooter totalSteps={frames.length} playback={playback} />
    </div>
  );
}
