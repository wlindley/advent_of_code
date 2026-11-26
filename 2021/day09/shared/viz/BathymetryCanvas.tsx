import { useEffect, useRef } from 'react';
import type { BasinFloodFrame, LowPointScanFrame, SmokeBasinTraceFrame } from '../index';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 400;
const PADDING = 14;
const CONTOUR_COLORS = ['#dbeafe', '#cde4fb', '#bfdcf6', '#cde6ee', '#dcecdf', '#eaeed6', '#f2e8c9', '#f5dec0', '#f3cfb2'] as const;

interface CanvasPalette {
  readonly surface: string;
  readonly border: string;
  readonly text: string;
  readonly accent: string;
  readonly gold: string;
  readonly ok: string;
  readonly warn: string;
}

function readToken(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const val = styles.getPropertyValue(name).trim();
  return val.length > 0 ? val : fallback;
}

function resolvePalette(canvas: HTMLCanvasElement): CanvasPalette {
  const styles = getComputedStyle(canvas);
  return {
    surface: readToken(styles, '--surface', '#ffffff'),
    border: readToken(styles, '--border', '#d0d7de'),
    text: readToken(styles, '--text', '#1f2328'),
    accent: readToken(styles, '--accent', '#0969da'),
    gold: readToken(styles, '--gold', '#9a6700'),
    ok: readToken(styles, '--ok', '#1a7f37'),
    warn: readToken(styles, '--warn', '#bc4c00'),
  };
}

function drawCells(
  ctx: CanvasRenderingContext2D, frame: SmokeBasinTraceFrame, colors: CanvasPalette,
  ox: number, oy: number, cell: number,
): void {
  const { heightmap } = frame.analysis;
  const topIds = frame.kind === 'largest-basins-product'
    ? new Set(frame.topBasins.map((b) => b.basinId))
    : null;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.max(10, Math.floor(cell * 0.46))}px ui-monospace, monospace`;
  for (let r = 0; r < heightmap.rows; r += 1) {
    for (let c = 0; c < heightmap.cols; c += 1) {
      const x = ox + c * cell;
      const y = oy + r * cell;
      const h = heightmap.at(r, c);
      ctx.fillStyle = h === 9 ? colors.text : CONTOUR_COLORS[h]!;
      ctx.fillRect(x, y, cell, cell);
      if (topIds !== null) drawFloodOverlay(ctx, frame as BasinFloodFrame, r, c, x, y, cell, topIds, colors);
      if (cell >= 18) {
        ctx.fillStyle = h === 9 ? colors.surface : colors.text;
        ctx.fillText(String(h), x + cell / 2, y + cell / 2);
      }
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = cell >= 10 ? 0.6 : 0.25;
      ctx.strokeRect(x, y, cell, cell);
    }
  }
}

function drawFloodOverlay(
  ctx: CanvasRenderingContext2D, frame: BasinFloodFrame, r: number, c: number,
  x: number, y: number, cell: number, topIds: Set<number>, colors: CanvasPalette,
): void {
  const depth = frame.analysis.waveDepthAt(r, c);
  const bid = frame.analysis.basinIdAt(r, c);
  if (depth === null || bid === null || depth > frame.waveDepth) return;
  ctx.save();
  ctx.fillStyle = topIds.has(bid) ? colors.gold : colors.accent;
  ctx.globalAlpha = depth === frame.waveDepth ? 0.42 : topIds.has(bid) ? 0.28 : 0.16;
  ctx.fillRect(x, y, cell, cell);
  ctx.restore();
}

function drawLowPointPins(
  ctx: CanvasRenderingContext2D, frame: LowPointScanFrame, colors: CanvasPalette,
  ox: number, oy: number, cell: number,
): void {
  const radius = Math.max(3, cell * 0.34);
  for (let i = 0; i < frame.revealedLowPointCount; i += 1) {
    const lp = frame.analysis.lowPoints[i]!;
    const cx = ox + (lp.col + 0.5) * cell;
    const cy = oy + (lp.row + 0.5) * cell;
    const isActive = i === frame.revealedLowPointCount - 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? colors.gold : colors.ok;
    ctx.globalAlpha = 0.24;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = isActive ? 2.6 : 1.8;
    ctx.strokeStyle = isActive ? colors.warn : colors.ok;
    ctx.stroke();
  }
}

function renderBathymetry(canvas: HTMLCanvasElement, frame: SmokeBasinTraceFrame): void {
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = resolvePalette(canvas);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1);
  const { rows, cols } = frame.analysis.heightmap;
  const cell = Math.min((CANVAS_WIDTH - PADDING * 2) / cols, (CANVAS_HEIGHT - PADDING * 2) / rows);
  const ox = (CANVAS_WIDTH - cell * cols) / 2;
  const oy = (CANVAS_HEIGHT - cell * rows) / 2;
  drawCells(ctx, frame, colors, ox, oy, cell);
  if (frame.kind === 'low-point-risk') drawLowPointPins(ctx, frame, colors, ox, oy, cell);
}

/** HiDPI Canvas 2D bathymetric contour, ridge, low-point, and basin-flood renderer. */
export function BathymetryCanvas({ frame }: { readonly frame: SmokeBasinTraceFrame }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (canvasRef.current !== null) renderBathymetry(canvasRef.current, frame);
  }, [frame]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
      aria-label={`Heightmap ${frame.analysis.heightmap.rows} by ${frame.analysis.heightmap.cols} bathymetry grid`}
    />
  );
}
