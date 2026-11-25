import { useEffect, useMemo, useRef, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS, EMPTY_CELL_WAVE, SURVIVOR_WAVE,
  peelWarehouse, solver, type PeelingWaveFrame,
} from '../domain';

export function WarehousePeelingVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(140);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const state = useMemo(() => {
    try {
      const floor = solver.parse(rawInput);
      const peeling = peelWarehouse(floor);
      const frames = solver.trace!(floor, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      const denom = Math.max(1, peeling.totalWaves - 1);
      const contourColors = Array.from({ length: peeling.totalWaves + 1 }, (_, w) => {
        const t = w === 0 ? 0 : (w - 1) / denom;
        return `hsl(${Math.round(185 + 30 * t)}, 65%, ${Math.round(82 - 24 * t)}%)`;
      });
      const cellPx = Math.max(2, Math.min(28, Math.floor(420 / Math.max(floor.rows, floor.cols))));
      return { ok: true as const, floor, peeling, frames, contourColors, cellPx };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(false);
  }, [rawInput]);

  const frames: readonly PeelingWaveFrame[] = state.ok ? state.frames : [];
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
  const prevWave = clampedIndex > 0 ? frames[clampedIndex - 1]!.wave : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!state.ok || !frame || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { floor, peeling, contourColors, cellPx } = state;
    ctx.clearRect(0, 0, floor.cols * cellPx, floor.rows * cellPx);
    for (let r = 0; r < floor.rows; r += 1) {
      const rowOffset = r * floor.cols;
      for (let c = 0; c < floor.cols; c += 1) {
        const w = peeling.removalWave[rowOffset + c]!;
        ctx.fillStyle =
          w === EMPTY_CELL_WAVE ? '#f8fafc'
            : w === SURVIVOR_WAVE ? (frame.wave === peeling.totalWaves ? '#dc2626' : '#475569')
              : w > frame.wave ? '#475569'
                : w > prevWave ? '#f59e0b' : contourColors[w]!;
        ctx.fillRect(c * cellPx, r * cellPx, cellPx, cellPx);
      }
    }
  }, [state, frame, prevWave]);

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const { floor, peeling, contourColors, cellPx } = state;
  const maxBar = Math.max(1, ...peeling.waveCounts);
  const showLabels = peeling.totalWaves <= 16;

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Wave: <code>{frame.wave} / {peeling.totalWaves}</code></span>
        <span className="badge">This Wave: <code>{frame.removedThisWave}</code></span>
        <span className="badge">Remaining: <code>{peeling.totalRolls - frame.cumulativeRemoved}</code></span>
        <span className="badge status-solved">
          Removed: <strong className="gold"><code>{frame.cumulativeRemoved}</code></strong>
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', margin: '0.6rem 0' }}>
        <canvas
          ref={canvasRef}
          width={floor.cols * cellPx}
          height={floor.rows * cellPx}
          aria-label={`Warehouse floor ${floor.rows} by ${floor.cols} peeling waves`}
          style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', maxWidth: '100%' }}
        />

        <div style={{ flex: '1 1 240px', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
          <div className="eyebrow" style={{ marginBottom: '0.45rem' }}>
            Per-Wave Removals ({peeling.totalWaves} waves)
          </div>
          {peeling.totalWaves === 0 ? (
            <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              {peeling.totalRolls === 0 ? 'Warehouse floor is empty.' : `Stable 4-core: all ${peeling.totalRolls} rolls survive.`}
            </p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: showLabels ? 5 : 2, height: 108 }}>
              {peeling.waveCounts.map((count, i) => {
                const w = i + 1;
                const bg = w > frame.wave ? '#e2e8f0' : w > prevWave ? '#f59e0b' : contourColors[w]!;
                return (
                  <div
                    key={w}
                    title={`Wave ${w}: ${count} rolls`}
                    style={{ flex: 1, minWidth: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                  >
                    {showLabels && <span style={{ fontSize: '0.68rem', color: 'var(--text)' }}>{count}</span>}
                    <div style={{
                      width: '100%', background: bg, borderRadius: '3px 3px 0 0',
                      border: showLabels ? '1px solid var(--border)' : undefined,
                      height: `${Math.max(4, Math.round((count / maxBar) * 68))}px`,
                    }} />
                    {showLabels && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: w <= frame.wave ? 'var(--text)' : 'var(--muted)' }}>{w}</span>}
                  </div>
                );
              })}
            </div>
          )}
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
