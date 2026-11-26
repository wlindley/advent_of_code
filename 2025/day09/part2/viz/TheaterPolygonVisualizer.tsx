import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { TileRect } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS, findLargestInscribedRectangle, solver, type InscribedTraceFrame,
} from '../domain';

const W = 800, H = 520, PAD_X = 48, PAD_Y = 36, PLOT_W = W - PAD_X * 2, PLOT_H = H - PAD_Y * 2;

const project = (v: bigint, min: bigint, span: bigint) =>
  span === 0n ? 0.5 : Number(((v - min) * 100000n) / span) / 100000;

export function TheaterPolygonVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(220);

  const state = useMemo(() => {
    try {
      const points = solver.parse(rawInput);
      const result = findLargestInscribedRectangle(points);
      const frames = solver.trace!(points, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      const bounds = TileRect.bounding(points);
      return { ok: true as const, points, result, frames, bounds };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput]);

  const frames: readonly InscribedTraceFrame[] = state.ok ? state.frames : [];
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => {
        if (prev + 1 >= frames.length - 1) { setIsPlaying(false); return frames.length - 1; }
        return prev + 1;
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [isPlaying, speedMs, frames.length]);

  if (!state.ok || frames.length === 0) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const { points, result, bounds } = state;
  const spanX = bounds.maxX - bounds.minX, spanY = bounds.maxY - bounds.minY;
  const toX = (x: bigint) => PAD_X + project(x, bounds.minX, spanX) * PLOT_W;
  const toY = (y: bigint) => PAD_Y + project(y, bounds.minY, spanY) * PLOT_H;
  const rectBox = (r: TileRect) => {
    const x0 = toX(r.minX), y0 = toY(r.minY);
    return {
      x: r.minX === r.maxX ? x0 - 4 : x0,
      y: r.minY === r.maxY ? y0 - 4 : y0,
      width: r.minX === r.maxX ? 8 : Math.max(4, toX(r.maxX) - x0),
      height: r.minY === r.maxY ? 8 : Math.max(4, toY(r.maxY) - y0),
    };
  };

  const clamped = Math.min(frameIndex, frames.length - 1);
  const frame = frames[clamped]!;
  const polyPoints = points.map((p) => `${toX(p.x)},${toY(p.y)}`).join(' ');
  const bestBox = rectBox(frame.best), candBox = rectBox(frame.candidate);
  const candColor = frame.isNewBest ? 'var(--ok)' : 'var(--err)';
  const candLabel = frame.isNewBest
    ? `new best (${frame.candidate.area})`
    : `rejected · ${frame.invalidCells} invalid cell${frame.invalidCells === 1 ? '' : 's'}`;

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Grid: <code>{result.grid.width} × {result.grid.height}</code></span>
        <span className="badge">
          Pairs: <code>{result.checkedPairs}</code> checked · <code>{result.rejectedPairs}</code> rejected
        </span>
        <span className="badge">
          Step: <code>{frame.step} / {frame.totalSteps}</code>
          {frames.length < frame.totalSteps ? ` (${frames.length} sampled)` : ''}
        </span>
        <span className="badge">Candidate: <code>{candLabel}</code></span>
        <span className="badge status-solved">
          Best: <code>{frame.best.width} × {frame.best.height}</code> = <strong className="gold"><code>{frame.best.area}</code></strong>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Theater green polygon inscribed search step ${frame.step}, best rectangle area ${frame.best.area}`}
        style={{
          width: '100%', height: 'auto', display: 'block', margin: '0.6rem 0',
          border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)',
        }}
      >
        <polygon points={polyPoints} fill="var(--ok)" fillOpacity={0.14} stroke="var(--ok)" strokeWidth={2} />
        <rect {...bestBox} fill="var(--ok)" fillOpacity={0.28} stroke="var(--ok)" strokeWidth={2.5} />
        <rect
          {...candBox}
          fill={candColor}
          fillOpacity={0.12}
          stroke={candColor}
          strokeWidth={2}
          strokeDasharray="6 4"
        />
        {points.map((p, i) => (
          <circle key={i} cx={toX(p.x)} cy={toY(p.y)} r={points.length > 150 ? 2 : 3.2} fill="var(--err)" opacity={0.75} />
        ))}
        {[points[frame.candidateIndexA]!, points[frame.candidateIndexB]!].map((p, idx) => (
          <circle key={`c${idx}`} cx={toX(p.x)} cy={toY(p.y)} r={5.5} fill={candColor} stroke="var(--surface)" strokeWidth={1.5} />
        ))}
        {[points[frame.bestIndexA]!, points[frame.bestIndexB]!].map((p, idx) => (
          <circle key={`b${idx}`} cx={toX(p.x)} cy={toY(p.y)} r={5} fill="var(--gold)" stroke="var(--surface)" strokeWidth={1.5} />
        ))}
        <text x={PAD_X} y={H - 10} fontSize={11} fill="var(--muted)">
          x ∈ [{bounds.minX.toString()}, {bounds.maxX.toString()}]
        </text>
        <text x={W - PAD_X} y={H - 10} fontSize={11} textAnchor="end" fill="var(--muted)">
          y ∈ [{bounds.minY.toString()}, {bounds.maxY.toString()}]
        </text>
      </svg>

      <PlaybackControls
        step={clamped}
        totalSteps={frames.length}
        isPlaying={isPlaying}
        speedMs={speedMs}
        onTogglePlay={() => {
          if (!isPlaying && clamped >= frames.length - 1) setFrameIndex(0);
          setIsPlaying((p) => !p);
        }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
