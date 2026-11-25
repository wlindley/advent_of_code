import { useEffect, useMemo, useRef, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { CellState, DEFAULT_MAX_TRACE_STEPS, simulateBeams, solver, type BeamCascadeFrame } from '../domain';

const LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['Emitter S', '#4f46e5'],
  ['Active Beam', '#0ea5e9'],
  ['Swept Beam', '#06b6d4'],
  ['Active Split', '#f59e0b'],
  ['Past Split', '#059669'],
  ['Unreached ^', '#94a3b8'],
];

export function BeamCascadeVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(120);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const state = useMemo(() => {
    try {
      const manifold = solver.parse(rawInput);
      const simulation = simulateBeams(manifold);
      const frames = solver.trace!(manifold, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      const cellPx = Math.max(2, Math.min(24, Math.floor(460 / Math.max(manifold.rows, manifold.cols))));
      return { ok: true as const, manifold, simulation, frames, cellPx };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(false);
  }, [rawInput]);

  const frames: readonly BeamCascadeFrame[] = state.ok ? state.frames : [];
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => {
        if (prev + 1 >= frames.length - 1) {
          setIsPlaying(false);
          return frames.length - 1;
        }
        return prev + 1;
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [isPlaying, speedMs, frames.length]);

  const clampedIndex = Math.min(frameIndex, Math.max(0, frames.length - 1));
  const frame = frames[clampedIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!state.ok || !frame || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { manifold, simulation, cellPx } = state;
    const { rows, cols, startRow, startCol } = manifold;
    const { cellStates } = simulation;
    ctx.clearRect(0, 0, cols * cellPx, rows * cellPx);

    for (let r = 0; r < rows; r += 1) {
      const rowOffset = r * cols;
      const isActiveRow = r === frame.row;
      for (let c = 0; c < cols; c += 1) {
        if (r > frame.row) {
          ctx.fillStyle = manifold.isSplitter(r, c) ? '#cbd5e1' : '#f1f5f9';
        } else if (r === startRow && c === startCol) {
          ctx.fillStyle = '#4f46e5';
        } else {
          const cell = cellStates[rowOffset + c]!;
          ctx.fillStyle =
            cell === CellState.HitSplitter ? (isActiveRow ? '#f59e0b' : '#059669')
              : cell === CellState.UnreachedSplitter ? '#94a3b8'
                : cell === CellState.Beam ? (isActiveRow ? '#0ea5e9' : '#06b6d4')
                  : '#f8fafc';
        }
        ctx.fillRect(c * cellPx, r * cellPx, cellPx, cellPx);
      }
    }

    ctx.fillStyle = 'rgba(14, 165, 233, 0.22)';
    ctx.fillRect(0, frame.row * cellPx, cols * cellPx, cellPx);
  }, [state, frame]);

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const { manifold, cellPx } = state;
  return (
    <div>
      <div className="meta-row">
        <span className="badge">Row: <code>{frame.row + 1} / {manifold.rows}</code></span>
        <span className="badge">Active Beams: <code>{frame.activeBeams}</code></span>
        <span className="badge">Row Splits: <code>{frame.rowSplits}</code></span>
        <span className="badge status-solved">
          Splits: <strong className="gold"><code>{frame.cumulativeSplits} / {manifold.splitterCount}</code></strong>
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', margin: '0.6rem 0' }}>
        <canvas
          ref={canvasRef}
          width={manifold.cols * cellPx}
          height={manifold.rows * cellPx}
          aria-label={`Tachyon manifold ${manifold.rows} by ${manifold.cols} beam cascade`}
          style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', maxWidth: '100%' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: '0.8rem' }}>
          {LEGEND.map(([label, color]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: color, border: '1px solid var(--border)', flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <PlaybackControls
        step={clampedIndex}
        totalSteps={frames.length}
        isPlaying={isPlaying}
        speedMs={speedMs}
        onTogglePlay={() => { if (!isPlaying && clampedIndex >= frames.length - 1) setFrameIndex(0); setIsPlaying((p) => !p); }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
