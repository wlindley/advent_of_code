import { useEffect, useMemo, useRef, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS, EMPTY_DENSITY, simulateQuantum, solver, type QuantumTimelineFrame,
} from '../domain';

const STOPS = [[14, 165, 233], [99, 102, 241], [217, 70, 239], [245, 158, 11]] as const;
const LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['Emitter S', '#4f46e5'], ['Low Density (1)', '#0ea5e9'],
  ['Mid Density', '#6366f1'], ['High Density', '#d946ef'],
  ['Peak Density', '#f59e0b'], ['Active Split', '#facc15'],
  ['Past Split', '#10b981'], ['Unreached ^', '#94a3b8'],
];

function densityColor(logDensity: number, maxLogDensity: number): string {
  const t = maxLogDensity > 0 ? Math.min(1, Math.max(0, logDensity / maxLogDensity)) : 0;
  const scaled = t * 3, idx = Math.min(2, Math.floor(scaled)), u = scaled - idx;
  const a = STOPS[idx]!, b = STOPS[idx + 1]!;
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * u)}, ${Math.round(a[1] + (b[1] - a[1]) * u)}, ${Math.round(a[2] + (b[2] - a[2]) * u)})`;
}

export function QuantumManifoldVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(120);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const state = useMemo(() => {
    try {
      const manifold = solver.parse(rawInput);
      const simulation = simulateQuantum(manifold);
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

  const frames: readonly QuantumTimelineFrame[] = state.ok ? state.frames : [];
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
    const { cellLogDensity, maxLogDensity } = simulation;
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
          const ld = cellLogDensity[rowOffset + c]!;
          if (manifold.isSplitter(r, c)) {
            ctx.fillStyle = ld === EMPTY_DENSITY ? '#94a3b8' : isActiveRow ? '#facc15' : '#10b981';
          } else {
            ctx.fillStyle = ld === EMPTY_DENSITY ? '#f8fafc' : densityColor(ld, maxLogDensity);
          }
        }
        ctx.fillRect(c * cellPx, r * cellPx, cellPx, cellPx);
      }
    }

    ctx.fillStyle = 'rgba(217, 70, 239, 0.22)';
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
        <span className="badge">Active Cols: <code>{frame.activeCols}</code></span>
        <span className="badge">Peak Cell: <code>{frame.peakCellTimelines.toString()}</code></span>
        <span className="badge status-solved">
          Timelines: <strong className="gold"><code>{frame.totalTimelines.toString()}</code></strong>
        </span>
        {frame.exitedTimelines > 0n && (
          <span className="badge">Lateral Exits: <code>{frame.exitedTimelines.toString()}</code></span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', margin: '0.6rem 0' }}>
        <canvas
          ref={canvasRef}
          width={manifold.cols * cellPx}
          height={manifold.rows * cellPx}
          aria-label={`Quantum tachyon manifold ${manifold.rows} by ${manifold.cols} timeline density heatmap`}
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
