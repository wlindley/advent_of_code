import { useEffect, useRef } from 'react';
import { frameSheet, GLYPH_WIDTH, type Dot, type FoldInstruction, type OrigamiTraceFrame } from '../index';

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 360;
const PADDING = 20;

interface CanvasPalette {
  readonly surface: string; readonly bg: string; readonly border: string;
  readonly text: string; readonly accent: string; readonly gold: string;
}

interface Viewport {
  readonly minX: number; readonly minY: number; readonly cols: number;
  readonly rows: number; readonly cell: number; readonly ox: number; readonly oy: number;
}

function resolvePalette(canvas: HTMLCanvasElement): CanvasPalette {
  const s = getComputedStyle(canvas);
  const tok = (name: string, fb: string): string => s.getPropertyValue(name).trim() || fb;
  return {
    surface: tok('--surface', '#ffffff'),
    bg: tok('--bg', '#f6f8fa'),
    border: tok('--border', '#d0d7de'),
    text: tok('--text', '#1f2328'),
    accent: tok('--accent', '#0969da'),
    gold: tok('--gold', '#9a6700'),
  };
}

function dotKey(dot: Dot): string {
  return `${dot.x},${dot.y}`;
}

function computeViewport(frame: OrigamiTraceFrame, nextFold: FoldInstruction | null): Viewport {
  const bounds = frameSheet(frame).bounds;
  const minX = Math.min(0, bounds.minX);
  const minY = Math.min(0, bounds.minY);
  const maxX = nextFold?.axis === 'x' ? Math.max(bounds.maxX, nextFold.value) : bounds.maxX;
  const maxY = nextFold?.axis === 'y' ? Math.max(bounds.maxY, nextFold.value) : bounds.maxY;
  const cols = maxX - minX + 1;
  const rows = maxY - minY + 1;
  const cell = Math.min((CANVAS_WIDTH - PADDING * 2) / cols, (CANVAS_HEIGHT - PADDING * 2) / rows);
  return { minX, minY, cols, rows, cell, ox: (CANVAS_WIDTH - cell * cols) / 2, oy: (CANVAS_HEIGHT - cell * rows) / 2 };
}

function dotColor(dot: Dot, merged: Set<string>, reflected: Set<string>, colors: CanvasPalette): string {
  const key = dotKey(dot);
  if (merged.has(key)) return colors.gold;
  return reflected.has(key) ? colors.accent : colors.text;
}

function drawGlyphDividers(ctx: CanvasRenderingContext2D, vp: Viewport, colors: CanvasPalette): void {
  ctx.save();
  ctx.strokeStyle = colors.accent;
  ctx.globalAlpha = 0.4;
  ctx.setLineDash([4, 3]);
  for (let c = GLYPH_WIDTH; c < vp.cols; c += GLYPH_WIDTH) {
    const x = vp.ox + c * vp.cell;
    ctx.beginPath();
    ctx.moveTo(x, vp.oy);
    ctx.lineTo(x, vp.oy + vp.rows * vp.cell);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTileMode(ctx: CanvasRenderingContext2D, frame: OrigamiTraceFrame, vp: Viewport, colors: CanvasPalette, merged: Set<string>, reflected: Set<string>): void {
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = vp.cell >= 10 ? 0.8 : 0.4;
  for (let r = 0; r < vp.rows; r += 1) {
    for (let c = 0; c < vp.cols; c += 1) ctx.strokeRect(vp.ox + c * vp.cell, vp.oy + r * vp.cell, vp.cell, vp.cell);
  }
  drawGlyphDividers(ctx, vp, colors);
  const inset = Math.max(1, vp.cell * 0.1);
  for (const dot of frameSheet(frame).dots) {
    ctx.fillStyle = dotColor(dot, merged, reflected, colors);
    ctx.fillRect(vp.ox + (dot.x - vp.minX) * vp.cell + inset, vp.oy + (dot.y - vp.minY) * vp.cell + inset, vp.cell - inset * 2, vp.cell - inset * 2);
  }
}

function drawScatterMode(ctx: CanvasRenderingContext2D, frame: OrigamiTraceFrame, vp: Viewport, colors: CanvasPalette, merged: Set<string>, reflected: Set<string>): void {
  ctx.strokeStyle = colors.border;
  ctx.strokeRect(vp.ox, vp.oy, vp.cols * vp.cell, vp.rows * vp.cell);
  const radius = Math.max(1.6, Math.min(4.5, vp.cell * 0.7));
  for (const dot of frameSheet(frame).dots) {
    ctx.fillStyle = dotColor(dot, merged, reflected, colors);
    ctx.beginPath();
    ctx.arc(vp.ox + (dot.x - vp.minX + 0.5) * vp.cell, vp.oy + (dot.y - vp.minY + 0.5) * vp.cell, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCrease(ctx: CanvasRenderingContext2D, nextFold: FoldInstruction, vp: Viewport, colors: CanvasPalette): void {
  ctx.save();
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  if (nextFold.axis === 'x') {
    const x = vp.ox + (nextFold.value - vp.minX + 0.5) * vp.cell;
    ctx.moveTo(x, vp.oy);
    ctx.lineTo(x, vp.oy + vp.rows * vp.cell);
  } else {
    const y = vp.oy + (nextFold.value - vp.minY + 0.5) * vp.cell;
    ctx.moveTo(vp.ox, y);
    ctx.lineTo(vp.ox + vp.cols * vp.cell, y);
  }
  ctx.stroke();
  ctx.restore();
}

function renderSheet(canvas: HTMLCanvasElement, frame: OrigamiTraceFrame, nextFold: FoldInstruction | null): void {
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
  ctx.strokeRect(0.5, 0.5, CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1);
  const vp = computeViewport(frame, nextFold);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(vp.ox, vp.oy, vp.cols * vp.cell, vp.rows * vp.cell);
  const merged = new Set(frame.kind === 'folded' ? frame.outcome.mergedDots.map(dotKey) : []);
  const reflected = new Set(frame.kind === 'folded' ? frame.outcome.reflectedDots.map(dotKey) : []);
  const { width, height } = frameSheet(frame).bounds;
  if (width > 60 || height > 20) drawScatterMode(ctx, frame, vp, colors, merged, reflected);
  else drawTileMode(ctx, frame, vp, colors, merged, reflected);
  if (nextFold !== null) drawCrease(ctx, nextFold, vp, colors);
}

/** HiDPI Canvas 2D renderer switching between scatter and 5-column pixel-tile origami views. */
export function OrigamiSheetCanvas({ frame, nextFold }: { readonly frame: OrigamiTraceFrame; readonly nextFold: FoldInstruction | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (canvasRef.current !== null) renderSheet(canvasRef.current, frame, nextFold);
  }, [frame, nextFold]);
  const { width, height } = frameSheet(frame).bounds;
  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} aria-label={`Origami sheet ${width} by ${height}`} />;
}
