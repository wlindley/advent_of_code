import { useEffect, useRef, type MouseEvent } from 'react';
import type { CosmicExpansionTraceFrame, GalaxyCoord, UniverseMap } from '../index';

export interface StarfieldCanvasProps {
  readonly universe: UniverseMap;
  readonly galaxies: readonly GalaxyCoord[];
  readonly rowCounts: readonly number[];
  readonly colCounts: readonly number[];
  readonly activeFrame: CosmicExpansionTraceFrame;
  readonly selectedIndices: readonly number[];
  readonly onSelectGalaxy: (index: number) => void;
}

const C = {
  surface: '#ffffff', grid: '#e2e8f0', riftFill: 'rgba(139, 92, 246, 0.16)',
  riftBorder: 'rgba(124, 58, 237, 0.42)', cutFill: 'rgba(9, 105, 218, 0.14)', cutStroke: '#0969da',
  prefix: '#0284c7', prefixGlow: 'rgba(2, 132, 199, 0.28)', suffix: '#d97706',
  suffixGlow: 'rgba(217, 119, 6, 0.28)', pathStroke: '#1a7f37', selectedRing: '#9a6700',
};

function drawRiftBands(
  ctx: CanvasRenderingContext2D, rows: number, cols: number,
  rowCounts: readonly number[], colCounts: readonly number[], cell: number,
): void {
  ctx.fillStyle = C.riftFill;
  ctx.strokeStyle = C.riftBorder;
  ctx.lineWidth = 1;
  for (let r = 0; r < rows; r += 1) {
    if (rowCounts[r] !== 0) continue;
    ctx.fillRect(0, r * cell, cols * cell, cell);
    ctx.strokeRect(0.5, r * cell + 0.5, cols * cell - 1, cell - 1);
  }
  for (let c = 0; c < cols; c += 1) {
    if (colCounts[c] !== 0) continue;
    ctx.fillRect(c * cell, 0, cell, rows * cell);
    ctx.strokeRect(c * cell + 0.5, 0.5, cell - 1, rows * cell - 1);
  }
}

function drawGridLines(ctx: CanvasRenderingContext2D, rows: number, cols: number, cell: number): void {
  if (cell < 6) return;
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let r = 0; r <= rows; r += 1) { ctx.moveTo(0, r * cell); ctx.lineTo(cols * cell, r * cell); }
  for (let c = 0; c <= cols; c += 1) { ctx.moveTo(c * cell, 0); ctx.lineTo(c * cell, rows * cell); }
  ctx.stroke();
}

function drawSweepCut(
  ctx: CanvasRenderingContext2D, frame: CosmicExpansionTraceFrame,
  rows: number, cols: number, cell: number,
): void {
  ctx.fillStyle = C.cutFill;
  ctx.strokeStyle = C.cutStroke;
  ctx.lineWidth = Math.max(1.5, cell * 0.14);
  const isRow = frame.axis === 'row';
  ctx.fillRect(isRow ? 0 : frame.index * cell, isRow ? frame.index * cell : 0, isRow ? cols * cell : cell, isRow ? cell : rows * cell);
  ctx.beginPath();
  if (isRow) { ctx.moveTo(0, (frame.index + 1) * cell); ctx.lineTo(cols * cell, (frame.index + 1) * cell); }
  else { ctx.moveTo((frame.index + 1) * cell, 0); ctx.lineTo((frame.index + 1) * cell, rows * cell); }
  ctx.stroke();
}

function drawSelectedPath(
  ctx: CanvasRenderingContext2D, galaxies: readonly GalaxyCoord[],
  selectedIndices: readonly number[], cell: number,
): void {
  if (selectedIndices.length !== 2) return;
  const a = galaxies[selectedIndices[0]!]!;
  const b = galaxies[selectedIndices[1]!]!;
  ctx.save();
  ctx.strokeStyle = C.pathStroke;
  ctx.lineWidth = Math.max(2, cell * 0.2);
  ctx.setLineDash([Math.max(4, cell * 0.35), Math.max(3, cell * 0.2)]);
  ctx.beginPath();
  ctx.moveTo((a.col + 0.5) * cell, (a.row + 0.5) * cell);
  ctx.lineTo((b.col + 0.5) * cell, (a.row + 0.5) * cell);
  ctx.lineTo((b.col + 0.5) * cell, (b.row + 0.5) * cell);
  ctx.stroke();
  ctx.restore();
}

function drawGalaxies(
  ctx: CanvasRenderingContext2D, galaxies: readonly GalaxyCoord[],
  frame: CosmicExpansionTraceFrame, selectedIndices: readonly number[], cell: number,
): void {
  const r = Math.max(2.4, cell * 0.34);
  const selected = new Set(selectedIndices);
  for (let i = 0; i < galaxies.length; i += 1) {
    const g = galaxies[i]!;
    const cx = (g.col + 0.5) * cell;
    const cy = (g.row + 0.5) * cell;
    const isPrefix = frame.axis === 'row' ? g.row <= frame.index : g.col <= frame.index;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = isPrefix ? C.prefixGlow : C.suffixGlow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = isPrefix ? C.prefix : C.suffix;
    ctx.fill();
    if (selected.has(i)) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.65, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(2, cell * 0.16);
      ctx.strokeStyle = C.selectedRing;
      ctx.stroke();
    }
  }
}

function findClickedGalaxyIndex(
  event: MouseEvent<HTMLCanvasElement>, galaxies: readonly GalaxyCoord[],
  cssW: number, cssH: number, cell: number,
): number {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return -1;
  const x = ((event.clientX - rect.left) / rect.width) * cssW;
  const y = ((event.clientY - rect.top) / rect.height) * cssH;
  const maxDist = Math.max(cell * 1.8, 14);
  let best = -1;
  let bestD2 = maxDist * maxDist;
  for (let i = 0; i < galaxies.length; i += 1) {
    const dx = (galaxies[i]!.col + 0.5) * cell - x;
    const dy = (galaxies[i]!.row + 0.5) * cell - y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD2) { bestD2 = d2; best = i; }
  }
  return best;
}

function paintStarfield(ctx: CanvasRenderingContext2D, props: StarfieldCanvasProps, cell: number, cssW: number, cssH: number): void {
  const { universe, galaxies, rowCounts, colCounts, activeFrame, selectedIndices } = props;
  ctx.fillStyle = C.surface;
  ctx.fillRect(0, 0, cssW, cssH);
  drawGridLines(ctx, universe.rows, universe.cols, cell);
  drawRiftBands(ctx, universe.rows, universe.cols, rowCounts, colCounts, cell);
  drawSweepCut(ctx, activeFrame, universe.rows, universe.cols, cell);
  drawSelectedPath(ctx, galaxies, selectedIndices, cell);
  drawGalaxies(ctx, galaxies, activeFrame, selectedIndices, cell);
}

/** HiDPI starfield canvas showing cosmic rifts, axis sweep cut, and interactive galaxy pairs. */
export function StarfieldCanvas(props: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { universe, galaxies, rowCounts, colCounts, activeFrame, selectedIndices, onSelectGalaxy } = props;
  const cell = Math.max(4, Math.floor(620 / Math.max(universe.rows, universe.cols)));
  const cssW = universe.cols * cell;
  const cssH = universe.rows * cell;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintStarfield(ctx, props, cell, cssW, cssH);
  }, [universe, galaxies, rowCounts, colCounts, activeFrame, selectedIndices, cell, cssW, cssH]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Cosmic expansion starfield canvas"
      onClick={(e) => { const idx = findClickedGalaxyIndex(e, galaxies, cssW, cssH, cell); if (idx >= 0) onSelectGalaxy(idx); }}
      style={{
        width: '100%', maxWidth: `${cssW}px`, height: 'auto', display: 'block', margin: '0 auto',
        border: '1px solid var(--border)', borderRadius: '8px', cursor: galaxies.length >= 2 ? 'crosshair' : 'default',
      }}
    />
  );
}
