import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { isSchematicSymbol, type EngineSchematic } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, type SchematicTraceFrame } from '../domain';
import { computeLensBounds, computeOverviewCellPx, drawSchematicOverview, type WindowBounds } from './schematicCanvas';

type TraceState =
  | { readonly ok: true; readonly schematic: EngineSchematic; readonly frames: readonly SchematicTraceFrame[] }
  | { readonly ok: false; readonly message: string };

const SMALL_ROWS = 20;
const SMALL_COLS = 30;
const CELL_PX = 26;

function buildTraceState(rawInput: string): TraceState {
  try {
    const schematic = solver.parse(rawInput);
    return { ok: true, schematic, frames: solver.trace!(schematic, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function SchematicOverviewCanvas({ schematic, frame }: { readonly schematic: EngineSchematic; readonly frame: SchematicTraceFrame }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellPx = computeOverviewCellPx(schematic.rows, schematic.cols);
  useEffect(() => {
    if (canvasRef.current) drawSchematicOverview(canvasRef.current, schematic, frame, cellPx);
  }, [schematic, frame, cellPx]);
  return (
    <canvas
      ref={canvasRef} width={schematic.cols * cellPx} height={schematic.rows * cellPx}
      aria-label={`Engine schematic ${schematic.rows} by ${schematic.cols} overview`}
      style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', maxWidth: '100%' }}
    />
  );
}

function renderPartRects(schematic: EngineSchematic, frame: SchematicTraceFrame, bounds: WindowBounds): ReactNode[] {
  const matched = new Set(frame.matchedPartIds);
  const newly = new Set(frame.newlyMatchedIds);
  return schematic.numbers
    .filter((p) => p.row >= bounds.rowStart && p.row <= bounds.rowEnd && p.endCol >= bounds.colStart && p.startCol <= bounds.colEnd)
    .map((p) => {
      const c0 = Math.max(bounds.colStart, p.startCol) - bounds.colStart;
      const c1 = Math.min(bounds.colEnd, p.endCol) - bounds.colStart;
      const stroke = newly.has(p.id) ? 'var(--gold)' : matched.has(p.id) ? 'var(--ok)' : 'var(--border)';
      return (
        <rect
          key={p.id} x={c0 * CELL_PX + 1} y={(p.row - bounds.rowStart) * CELL_PX + 2}
          width={(c1 - c0 + 1) * CELL_PX - 2} height={CELL_PX - 4} rx={4}
          fill={stroke} fillOpacity={newly.has(p.id) ? 0.24 : matched.has(p.id) ? 0.16 : 0.1}
          stroke={stroke} strokeWidth={newly.has(p.id) ? 1.8 : 1}
        />
      );
    });
}

function renderWindowCells(schematic: EngineSchematic, frame: SchematicTraceFrame, bounds: WindowBounds): ReactNode[] {
  const cells: ReactNode[] = [];
  for (let r = bounds.rowStart; r <= bounds.rowEnd; r += 1) {
    for (let c = bounds.colStart; c <= bounds.colEnd; c += 1) {
      const ch = schematic.grid.at(r, c);
      const active = r === frame.symbol.row && c === frame.symbol.col;
      const x = (c - bounds.colStart) * CELL_PX;
      const y = (r - bounds.rowStart) * CELL_PX;
      cells.push(
        <g key={`${r}-${c}`}>
          {active && <rect x={x + 1} y={y + 1} width={CELL_PX - 2} height={CELL_PX - 2} rx={4} fill="var(--accent)" />}
          <text
            x={x + CELL_PX / 2} y={y + CELL_PX / 2 + 4.5} textAnchor="middle" fontSize={13}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight={active || isSchematicSymbol(ch) ? 700 : 500}
            fill={active ? '#ffffff' : ch === '.' ? 'var(--muted)' : 'var(--text)'}
          >{ch === '.' ? '·' : ch}</text>
        </g>,
      );
    }
  }
  return cells;
}

function SchematicWindowSvg({ schematic, frame, bounds, label }: { readonly schematic: EngineSchematic; readonly frame: SchematicTraceFrame; readonly bounds: WindowBounds; readonly label: string }) {
  const cols = bounds.colEnd - bounds.colStart + 1;
  const rows = bounds.rowEnd - bounds.rowStart + 1;
  const c0 = Math.max(bounds.colStart, frame.symbol.col - 1);
  const r0 = Math.max(bounds.rowStart, frame.symbol.row - 1);
  const c1 = Math.min(bounds.colEnd, frame.symbol.col + 1);
  const r1 = Math.min(bounds.rowEnd, frame.symbol.row + 1);
  return (
    <svg viewBox={`0 0 ${cols * CELL_PX} ${rows * CELL_PX}`} style={{ width: '100%', maxWidth: cols * CELL_PX, display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }} role="img" aria-label={label}>
      {renderPartRects(schematic, frame, bounds)}
      {renderWindowCells(schematic, frame, bounds)}
      <rect x={(c0 - bounds.colStart) * CELL_PX + 0.5} y={(r0 - bounds.rowStart) * CELL_PX + 0.5} width={(c1 - c0 + 1) * CELL_PX - 1} height={(r1 - r0 + 1) * CELL_PX - 1} rx={3} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="3 2" />
    </svg>
  );
}

function FrameBadges({ schematic, frame, sampledCount }: { readonly schematic: EngineSchematic; readonly frame: SchematicTraceFrame; readonly sampledCount: number }) {
  return (
    <div className="meta-row">
      <span className="badge">Grid: <code>{schematic.rows}×{schematic.cols}</code></span>
      <span className="badge">Symbol #{frame.symbolIndex + 1}/{frame.totalSymbols}: <code>{frame.symbol.char}</code> @ ({frame.symbol.row},{frame.symbol.col})</span>
      <span className="badge">Adj: <code>{frame.adjacentParts.map((p) => p.value).join(', ') || 'none'}</code></span>
      <span className={`badge ${frame.stepDelta > 0 ? 'status-solved' : ''}`}>Step +{frame.stepDelta}</span>
      <span className="badge">Matched: <strong>{frame.matchedCount}</strong> / {schematic.numbers.length}</span>
      <span className="badge">Sum: <strong className="gold">{frame.runningSum}</strong></span>
      {schematic.symbols.length > sampledCount && <span className="muted">Sampled {sampledCount} of {schematic.symbols.length} symbols</span>}
    </div>
  );
}

export function GearRatiosVisualizer({ rawInput }: VisualizerProps) {
  const traceState = useMemo(() => buildTraceState(rawInput), [rawInput]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 240);
  if (!traceState.ok) return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  const { schematic } = traceState;
  if (frames.length === 0) {
    return (
      <div className="meta-row">
        <span className="badge">Grid: <code>{schematic.rows}×{schematic.cols}</code></span>
        <span className="badge">Numbers: <strong>{schematic.numbers.length}</strong></span>
        <span className="badge">Symbols: <strong>0</strong></span>
        <span className="badge">Sum: <strong className="gold">0</strong></span>
        <span className="muted">No schematic symbols found; no part numbers are adjacent to a symbol.</span>
      </div>
    );
  }
  const frame = frames[playback.step]!;
  const isSmall = schematic.rows <= SMALL_ROWS && schematic.cols <= SMALL_COLS;
  const bounds: WindowBounds = isSmall
    ? { rowStart: 0, rowEnd: schematic.rows - 1, colStart: 0, colEnd: schematic.cols - 1 }
    : computeLensBounds(schematic.rows, schematic.cols, frame.symbol.row, frame.symbol.col);
  return (
    <div>
      <FrameBadges schematic={schematic} frame={frame} sampledCount={frames.length} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', alignItems: 'flex-start', margin: '0.5rem 0' }}>
        {!isSmall && <SchematicOverviewCanvas schematic={schematic} frame={frame} />}
        <SchematicWindowSvg schematic={schematic} frame={frame} bounds={bounds} label={isSmall ? 'Engine schematic grid' : '15x15 local lens around active symbol'} />
      </div>
      <PlaybackControls step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs} onTogglePlay={() => togglePlayback(playback, frames.length)} onStepChange={(next) => selectStep(playback, next)} onSpeedChange={playback.setSpeedMs} />
    </div>
  );
}
