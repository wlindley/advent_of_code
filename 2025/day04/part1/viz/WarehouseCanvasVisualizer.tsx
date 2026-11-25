import { useEffect, useMemo, useRef, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  MAX_BLOCKING_NEIGHBORS,
  solver,
  type FloorScanFrame,
} from '../domain';

const DEGREE_COLORS = [
  '#059669', '#10b981', '#34d399', '#6ee7b7',
  '#fde68a', '#fbbf24', '#f97316', '#ef4444', '#991b1b',
] as const;

export function WarehouseCanvasVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const state = useMemo(() => {
    try {
      const floor = solver.parse(rawInput);
      const { degrees } = floor.computeDegreeMap();
      const frames = solver.trace!(floor, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      const cellPx = Math.max(2, Math.min(28, Math.floor(420 / Math.max(floor.rows, floor.cols))));
      return { ok: true as const, floor, degrees, frames, cellPx };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(false);
  }, [rawInput]);

  const frames: readonly FloorScanFrame[] = state.ok ? state.frames : [];
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

    const { floor, degrees, cellPx } = state;
    const width = floor.cols * cellPx;
    const height = floor.rows * cellPx;
    ctx.clearRect(0, 0, width, height);

    for (let r = 0; r < floor.rows; r += 1) {
      const scanned = r < frame.scannedRows;
      const rowOffset = r * floor.cols;
      for (let c = 0; c < floor.cols; c += 1) {
        const roll = floor.isRoll(r, c);
        ctx.fillStyle = scanned
          ? roll ? DEGREE_COLORS[degrees[rowOffset + c]!]! : '#f8fafc'
          : roll ? '#cbd5e1' : '#f1f5f9';
        ctx.fillRect(c * cellPx, r * cellPx, cellPx, cellPx);
      }
    }

    if (frame.scannedRows > 0 && frame.scannedRows < floor.rows) {
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, frame.scannedRows * cellPx - 1, width, 2);
    }
  }, [state, frame]);

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const { floor, cellPx } = state;
  const maxBar = Math.max(1, ...frame.degreeHistogram);

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Rows: <code>{frame.scannedRows} / {floor.rows}</code></span>
        <span className="badge">Rolls: <code>{frame.totalRolls}</code></span>
        <span className="badge status-solved">
          Accessible (&lt;{MAX_BLOCKING_NEIGHBORS}): <strong className="gold"><code>{frame.accessibleCount}</code></strong>
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', margin: '0.6rem 0' }}>
        <canvas
          ref={canvasRef}
          width={floor.cols * cellPx}
          height={floor.rows * cellPx}
          aria-label={`Warehouse floor ${floor.rows} by ${floor.cols} degree heatmap`}
          style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', maxWidth: '100%' }}
        />

        <div style={{ flex: '1 1 240px', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
          <div className="eyebrow" style={{ marginBottom: '0.45rem' }}>
            Neighbor Degree Histogram (Accessible &lt;4 | Blocked ≥4)
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 108 }}>
            {frame.degreeHistogram.map((count, deg) => (
              <div
                key={deg}
                title={`Degree ${deg}: ${count} rolls`}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end',
                  borderLeft: deg === MAX_BLOCKING_NEIGHBORS ? '2px dashed var(--border)' : undefined,
                  paddingLeft: deg === MAX_BLOCKING_NEIGHBORS ? 6 : 0,
                }}
              >
                <span style={{ fontSize: '0.68rem', color: 'var(--text)' }}>{count}</span>
                <div style={{
                  width: '100%', background: DEGREE_COLORS[deg], borderRadius: '3px 3px 0 0', border: '1px solid var(--border)',
                  height: `${Math.max(count > 0 ? 4 : 0, Math.round((count / maxBar) * 68))}px`,
                }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: deg < MAX_BLOCKING_NEIGHBORS ? 'var(--ok)' : 'var(--text)' }}>
                  {deg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PlaybackControls
        step={clampedIndex} totalSteps={frames.length} isPlaying={isPlaying} speedMs={speedMs}
        onTogglePlay={() => { if (!isPlaying && clampedIndex >= frames.length - 1) setFrameIndex(0); setIsPlaying((p) => !p); }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
