import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import type { TreeFarm } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, type FarmTraceFrame, type PlacedPiece } from '../domain';

const PALETTE = ['#0969da', '#1a7f37', '#9a6700', '#8250df', '#bf3989', '#bc4c00', '#0550ae', '#1b7c83'];
const colorOf = (shapeIdx: number): string => PALETTE[shapeIdx % PALETTE.length]!;

function piecePath(piece: PlacedPiece, cellSize: number, inset: number): string {
  const s = Math.max(1, cellSize - inset * 2);
  return piece.cells.map(({ row, col }) => `M${col * cellSize + inset} ${row * cellSize + inset}h${s}v${s}h${-s}z`).join('');
}

export function TreeFarmVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(420);

  const state = useMemo(() => {
    try {
      const farm: TreeFarm = solver.parse(rawInput);
      return { ok: true as const, farm, frames: solver.trace!(farm, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
    } catch (err) {
      return { ok: false as const, message: err instanceof Error ? err.message : String(err) };
    }
  }, [rawInput]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput]);

  const frames: readonly FarmTraceFrame[] = state.ok ? state.frames : [];
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

  const frame = frames[Math.min(frameIndex, frames.length - 1)]!;
  const { region, evaluation } = frame;
  const shapes = state.farm.shapes;
  const maxDim = Math.max(region.width, region.height);
  const cellSize = Math.max(8, Math.min(36, Math.floor(420 / maxDim)));
  const inset = cellSize >= 14 ? 1.5 : 0.6;
  const boardW = region.width * cellSize;
  const boardH = region.height * cellSize;
  const isExact = evaluation.verdict === 'exact-feasible' || evaluation.verdict === 'exact-infeasible';
  const ratio = Math.min(1, evaluation.requiredArea / Math.max(1, region.area));
  const doneRegions = frame.feasibleSoFar + frame.infeasibleSoFar;

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Region <code>{frame.regionIndex + 1}/{frame.totalRegions}</code> · <code>{region.width}×{region.height}</code></span>
        <span className={`badge ${evaluation.feasible ? 'status-solved' : 'status-blocked'}`}>
          <code>{evaluation.verdict}</code> ({isExact ? `exact · ${evaluation.statesExplored} states` : 'fast-path'})
        </span>
        <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
          Feasible: <strong className="gold"><code>{frame.feasibleSoFar}</code></strong> / <code>{doneRegions}</code>
        </span>
        <span className="badge muted">
          Fast ✓<code>{frame.fastPathFeasibleSoFar}</code> ✗<code>{frame.fastPathInfeasibleSoFar}</code> · Exact <code>{frame.exactSolvedSoFar}</code>
        </span>
      </div>

      <div className="meta-row" style={{ gap: '0.45rem' }}>
        {shapes.map((sh) => {
          const cnt = region.counts[sh.id] ?? 0;
          const color = colorOf(sh.id);
          return (
            <div key={sh.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px',
              borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', opacity: cnt > 0 ? 1 : 0.45,
            }}>
              <svg width={sh.width * 8 + 2} height={sh.height * 8 + 2} aria-hidden="true">
                {sh.cells.map((c, idx) => (
                  <rect key={idx} x={c.col * 8 + 1} y={c.row * 8 + 1} width={7} height={7} rx={1.5} fill={color} />
                ))}
              </svg>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
                #{sh.id} <code>×{cnt}</code>
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
        <svg
          viewBox={`0 0 ${boardW} ${boardH}`}
          role="img"
          aria-label={`Region ${frame.regionIndex + 1} (${region.width}x${region.height}): ${evaluation.verdict}`}
          style={{ width: '100%', maxWidth: Math.max(280, Math.min(640, boardW * 1.4)), maxHeight: 380, height: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4 }}
        >
          {maxDim <= 55 && Array.from({ length: region.width - 1 }, (_, i) => (
            <line key={`v${i}`} x1={(i + 1) * cellSize} y1={0} x2={(i + 1) * cellSize} y2={boardH} stroke="var(--border)" strokeWidth={0.6} />
          ))}
          {maxDim <= 55 && Array.from({ length: region.height - 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={(i + 1) * cellSize} x2={boardW} y2={(i + 1) * cellSize} stroke="var(--border)" strokeWidth={0.6} />
          ))}
          {evaluation.placements?.map((p, i) => (
            <path key={i} d={piecePath(p, cellSize, inset)} fill={colorOf(p.shapeIndex)} fillOpacity={0.9} />
          ))}
          {!evaluation.feasible && (
            <g>
              <rect x={0} y={0} width={boardW} height={boardH} fill="var(--surface)" fillOpacity={0.82} />
              <rect x={boardW * 0.12} y={boardH * 0.34} width={boardW * 0.76} height={boardH * 0.32} rx={6} fill="var(--surface)" stroke="var(--err)" strokeWidth={1.5} />
              <text x={boardW / 2} y={boardH * 0.47} textAnchor="middle" fontSize={Math.max(11, Math.min(18, boardW * 0.05))} fontWeight={700} fill="var(--err)">
                {evaluation.verdict === 'area-impossible'
                  ? `Area overflow: ${evaluation.requiredArea} > ${region.area}`
                  : evaluation.verdict === 'dimension-impossible'
                    ? `Shape exceeds ${region.width}×${region.height} bounds`
                    : `Exact UNSAT (${evaluation.statesExplored} states)`}
              </text>
              <rect x={boardW * 0.2} y={boardH * 0.55} width={boardW * 0.6} height={Math.max(5, boardH * 0.04)} rx={3} fill="var(--border)" />
              <rect x={boardW * 0.2} y={boardH * 0.55} width={boardW * 0.6 * ratio} height={Math.max(5, boardH * 0.04)} rx={3} fill="var(--err)" />
            </g>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--border)', marginTop: '0.6rem' }} aria-label="Region feasibility breakdown">
        <div style={{ width: `${(frame.feasibleSoFar / frame.totalRegions) * 100}%`, background: 'var(--ok)' }} />
        <div style={{ width: `${(frame.infeasibleSoFar / frame.totalRegions) * 100}%`, background: 'var(--err)' }} />
      </div>

      <PlaybackControls
        step={frame.stepIndex}
        totalSteps={frame.totalSteps}
        isPlaying={isPlaying}
        speedMs={speedMs}
        onTogglePlay={() => {
          if (!isPlaying && frame.stepIndex >= frames.length - 1) setFrameIndex(0);
          setIsPlaying((p) => !p);
        }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
