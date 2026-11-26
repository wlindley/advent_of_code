import { useEffect, useRef } from 'react';
import { BoundingBox, type DiffusionFrame } from '../index';

const CANVAS_W = 720;
const CANVAS_H = 540;
const PAD = 18;

interface Palette {
  readonly bg: string; readonly surface: string; readonly border: string;
  readonly ok: string; readonly gold: string;
}
interface Layout {
  readonly cell: number; readonly ox: number; readonly oy: number; readonly view: BoundingBox;
}
export interface DiffusionCanvasProps {
  readonly frames: readonly DiffusionFrame[];
  readonly frame: DiffusionFrame;
}

function readPalette(el: HTMLElement): Palette {
  const s = getComputedStyle(el);
  const pick = (name: string, fb: string) => s.getPropertyValue(name).trim() || fb;
  return {
    bg: pick('--bg', '#f6f8fa'), surface: pick('--surface', '#ffffff'),
    border: pick('--border', '#d0d7de'), ok: pick('--ok', '#1a7f37'), gold: pick('--gold', '#9a6700'),
  };
}

function computeUnionBounds(frames: readonly DiffusionFrame[]): BoundingBox {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (let i = 0; i < frames.length; i += 1) {
    const b = frames[i]!.bounds;
    if (b.minRow < minR) minR = b.minRow;
    if (b.maxRow > maxR) maxR = b.maxRow;
    if (b.minCol < minC) minC = b.minCol;
    if (b.maxCol > maxC) maxC = b.maxCol;
  }
  return new BoundingBox(minR, maxR, minC, maxC);
}

function computeLayout(view: BoundingBox): Layout {
  const cell = Math.min((CANVAS_W - PAD * 2) / view.width, (CANVAS_H - PAD * 2) / view.height);
  return { cell, ox: (CANVAS_W - view.width * cell) / 2, oy: (CANVAS_H - view.height * cell) / 2, view };
}

function drawGrid(ctx: CanvasRenderingContext2D, layout: Layout, pal: Palette): void {
  const { cell, ox, oy, view } = layout;
  if (cell < 7) return;
  ctx.strokeStyle = pal.border;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let r = 0; r <= view.height; r += 1) { ctx.moveTo(ox, oy + r * cell); ctx.lineTo(ox + view.width * cell, oy + r * cell); }
  for (let c = 0; c <= view.width; c += 1) { ctx.moveTo(ox + c * cell, oy); ctx.lineTo(ox + c * cell, oy + view.height * cell); }
  ctx.stroke();
}

function drawBoundingRect(ctx: CanvasRenderingContext2D, frame: DiffusionFrame, layout: Layout, pal: Palette): void {
  const { cell, ox, oy, view } = layout;
  const b = frame.bounds;
  const x = ox + (b.minCol - view.minCol) * cell;
  const y = oy + (b.minRow - view.minRow) * cell;
  ctx.fillStyle = 'rgba(154, 103, 0, 0.11)';
  ctx.fillRect(x, y, b.width * cell, b.height * cell);
  ctx.strokeStyle = pal.gold;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x, y, b.width * cell, b.height * cell);
  ctx.setLineDash([]);
}

function drawElves(ctx: CanvasRenderingContext2D, frame: DiffusionFrame, layout: Layout, pal: Palette): void {
  const { cell, ox, oy, view } = layout;
  const radius = Math.max(1.8, cell * 0.36);
  for (let i = 0; i < frame.elfCount; i += 1) {
    const cx = ox + (frame.elfCols[i]! - view.minCol + 0.5) * cell;
    const cy = oy + (frame.elfRows[i]! - view.minRow + 0.5) * cell;
    const moved = frame.movedFlags[i] === 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = moved ? pal.ok : '#0f766e';
    ctx.fill();
    if (cell >= 6) {
      ctx.strokeStyle = moved ? pal.gold : pal.surface;
      ctx.lineWidth = moved ? 1.8 : 1;
      ctx.stroke();
    }
  }
}

const CANVAS_STYLE = {
  display: 'block', width: '100%', maxWidth: `${CANVAS_W}px`, aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
  border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)',
} as const;

/** HiDPI Canvas2D renderer with stable union-bounds camera and tight bounding rectangle overlay. */
export function DiffusionCanvas({ frames, frame }: DiffusionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || frames.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CANVAS_W * dpr);
    canvas.height = Math.round(CANVAS_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pal = readPalette(canvas);
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const layout = computeLayout(computeUnionBounds(frames));
    drawGrid(ctx, layout, pal);
    drawBoundingRect(ctx, frame, layout, pal);
    drawElves(ctx, frame, layout, pal);
  }, [frames, frame]);
  return <canvas ref={canvasRef} style={CANVAS_STYLE} aria-label="Unstable Diffusion elf grid" />;
}
