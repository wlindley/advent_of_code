import { useEffect, useRef } from 'react';
import {
  type CaveBounds,
  type CavePoint,
  CELL_ROCK,
  type ReservoirField,
  type ReservoirTraceFrame,
  SOURCE_X,
  SOURCE_Y,
} from '../index';

const CANVAS_W = 720;
const CANVAS_H = 400;
const PAD = 16;

interface Palette {
  readonly surface: string;
  readonly border: string;
  readonly accent: string;
  readonly gold: string;
  readonly text: string;
}

interface Layout {
  readonly cellSize: number;
  readonly originX: number;
  readonly originY: number;
}

export interface ReservoirCanvasProps {
  readonly field: ReservoirField;
  readonly frame: ReservoirTraceFrame;
}

function cssVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  return styles.getPropertyValue(name).trim() || fallback;
}

function readPalette(el: HTMLElement): Palette {
  const s = getComputedStyle(el);
  return {
    surface: cssVar(s, '--surface', '#ffffff'),
    border: cssVar(s, '--border', '#d0d7de'),
    accent: cssVar(s, '--accent', '#0969da'),
    gold: cssVar(s, '--gold', '#9a6700'),
    text: cssVar(s, '--text', '#1f2328'),
  };
}

function computeLayout(bounds: CaveBounds): Layout {
  const cellSize = Math.min((CANVAS_W - PAD * 2) / bounds.width, (CANVAS_H - PAD * 2) / bounds.height);
  return { cellSize, originX: (CANVAS_W - bounds.width * cellSize) / 2, originY: (CANVAS_H - bounds.height * cellSize) / 2 };
}

function sandColor(order: number, total: number): string {
  const t = total <= 1 ? 1 : (order - 1) / (total - 1);
  return `rgb(${Math.round(224 - t * 62)}, ${Math.round(179 - t * 76)}, ${Math.round(92 - t * 84)})`;
}

function drawCells(
  ctx: CanvasRenderingContext2D, field: ReservoirField, frame: ReservoirTraceFrame,
  layout: Layout, palette: Palette,
): void {
  const { bounds } = field;
  const { cellSize, originX, originY } = layout;
  for (let y = 0; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const val = field.cellAt(x, y);
      if (val === CELL_ROCK) ctx.fillStyle = bounds.floorY === y ? '#4b5563' : '#24292f';
      else if (val > 0 && val <= frame.settledCount) ctx.fillStyle = sandColor(val, frame.totalSettled);
      else continue;
      ctx.fillRect(originX + (x - bounds.minX) * cellSize, originY + y * cellSize, cellSize + 0.35, cellSize + 0.35);
    }
  }
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(originX, originY, bounds.width * cellSize, bounds.height * cellSize);
}

function drawEscapePath(
  ctx: CanvasRenderingContext2D, path: readonly CavePoint[], bounds: CaveBounds, layout: Layout,
): void {
  if (path.length < 2) return;
  const { cellSize, originX, originY } = layout;
  ctx.strokeStyle = '#0891b2';
  ctx.lineWidth = Math.max(2, Math.min(5, cellSize * 0.28));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < path.length; i += 1) {
    const cx = originX + (path[i]!.x - bounds.minX + 0.5) * cellSize;
    const cy = originY + (path[i]!.y + 0.5) * cellSize;
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();
}

function drawDot(
  ctx: CanvasRenderingContext2D, bounds: CaveBounds, layout: Layout,
  x: number, y: number, radius: number, fill: string, stroke?: string,
): void {
  const cx = layout.originX + (x - bounds.minX + 0.5) * layout.cellSize;
  const cy = layout.originY + (y + 0.5) * layout.cellSize;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

const CANVAS_STYLE = {
  display: 'block', width: '100%', maxWidth: `${CANVAS_W}px`, aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
  border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)',
} as const;

/** HiDPI Canvas2D cave cross-section showing rock walls, settled sand, and escape stream. */
export function ReservoirCanvas({ field, frame }: ReservoirCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CANVAS_W * dpr);
    canvas.height = Math.round(CANVAS_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const palette = readPalette(canvas);
    ctx.fillStyle = palette.surface;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const layout = computeLayout(field.bounds);
    const radius = Math.max(3.5, Math.min(10, layout.cellSize * 0.38));
    drawCells(ctx, field, frame, layout, palette);
    if (frame.phase === 'escaped') drawEscapePath(ctx, field.escapePath, field.bounds, layout);
    drawDot(ctx, field.bounds, layout, SOURCE_X, SOURCE_Y, radius, palette.accent);
    if (frame.activeGrain) {
      drawDot(ctx, field.bounds, layout, frame.activeGrain.x, frame.activeGrain.y, radius, palette.gold, palette.text);
    }
  }, [field, frame]);

  return (
    <div>
      <canvas ref={canvasRef} aria-label="Cave cross-section and sand reservoir" style={CANVAS_STYLE} />
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Source (500,0)</span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Sand Sediment</span>
        <span className="badge" style={{ borderColor: '#0891b2', color: '#0891b2' }}>Escape Stream</span>
      </div>
    </div>
  );
}
