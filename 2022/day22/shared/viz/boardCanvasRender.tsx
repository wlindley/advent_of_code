import { useEffect, useRef } from 'react';
import { Tile, type MonkeyBoard, type MonkeyMapTraceFrame, type Pose } from '../index';

const CANVAS_W = 720;
const CANVAS_H = 540;
const PAD = 14;

interface Palette {
  readonly bg: string; readonly surface: string; readonly border: string;
  readonly text: string; readonly accent: string; readonly ok: string; readonly gold: string;
}
interface Layout { readonly cell: number; readonly ox: number; readonly oy: number; }
export interface BoardCanvasProps {
  readonly board: MonkeyBoard;
  readonly frame: MonkeyMapTraceFrame;
  readonly faceSize?: number;
}

function readPalette(el: HTMLElement): Palette {
  const s = getComputedStyle(el);
  const pick = (name: string, fb: string) => s.getPropertyValue(name).trim() || fb;
  return {
    bg: pick('--bg', '#f6f8fa'), surface: pick('--surface', '#ffffff'),
    border: pick('--border', '#d0d7de'), text: pick('--text', '#1f2328'),
    accent: pick('--accent', '#0969da'), ok: pick('--ok', '#1a7f37'), gold: pick('--gold', '#9a6700'),
  };
}

function computeLayout(board: MonkeyBoard): Layout {
  const cell = Math.min((CANVAS_W - PAD * 2) / board.width, (CANVAS_H - PAD * 2) / board.height);
  return { cell, ox: (CANVAS_W - board.width * cell) / 2, oy: (CANVAS_H - board.height * cell) / 2 };
}

function drawTiles(ctx: CanvasRenderingContext2D, board: MonkeyBoard, layout: Layout, pal: Palette): void {
  const { cell, ox, oy } = layout;
  for (let r = 0; r < board.height; r += 1) {
    for (let c = 0; c < board.width; c += 1) {
      const tile = board.tileAt(r, c);
      if (tile === Tile.Void) continue;
      const x = ox + c * cell;
      const y = oy + r * cell;
      ctx.fillStyle = tile === Tile.Wall ? pal.text : pal.surface;
      ctx.fillRect(x, y, cell + 0.3, cell + 0.3);
      if (cell >= 6) {
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 0.6;
        ctx.strokeRect(x, y, cell, cell);
      }
    }
  }
}

function drawFaceBorders(
  ctx: CanvasRenderingContext2D, board: MonkeyBoard, faceSize: number, layout: Layout, pal: Palette,
): void {
  const { cell, ox, oy } = layout;
  ctx.strokeStyle = pal.text;
  ctx.lineWidth = 1.5;
  for (let r = 0; r < board.height; r += faceSize) {
    for (let c = 0; c < board.width; c += faceSize) {
      if (board.isPlayable(r, c)) ctx.strokeRect(ox + c * cell, oy + r * cell, faceSize * cell, faceSize * cell);
    }
  }
}

function drawTrail(ctx: CanvasRenderingContext2D, frame: MonkeyMapTraceFrame, layout: Layout, pal: Palette): void {
  const { cell, ox, oy } = layout;
  const lineW = Math.max(1.5, Math.min(4, cell * 0.25));
  ctx.lineCap = 'round';
  for (let i = 0; i < frame.trailCount; i += 1) {
    const seg = frame.trail[i]!;
    ctx.beginPath();
    ctx.moveTo(ox + (seg.fromCol + 0.5) * cell, oy + (seg.fromRow + 0.5) * cell);
    ctx.lineTo(ox + (seg.toCol + 0.5) * cell, oy + (seg.toRow + 0.5) * cell);
    ctx.strokeStyle = seg.isWrap ? 'rgba(9, 105, 218, 0.32)' : pal.accent;
    ctx.lineWidth = seg.isWrap ? 1.2 : lineW;
    ctx.setLineDash(seg.isWrap ? [4, 4] : []);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawWrapArc(ctx: CanvasRenderingContext2D, frame: MonkeyMapTraceFrame, layout: Layout, pal: Palette): void {
  if (!frame.lastWrap) return;
  const { cell, ox, oy } = layout;
  const x1 = ox + (frame.lastWrap.from.col + 0.5) * cell;
  const y1 = oy + (frame.lastWrap.from.row + 0.5) * cell;
  const x2 = ox + (frame.lastWrap.to.col + 0.5) * cell;
  const y2 = oy + (frame.lastWrap.to.row + 0.5) * cell;
  ctx.strokeStyle = pal.ok;
  ctx.lineWidth = 2.2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2 - (y2 - y1) * 0.18, (y1 + y2) / 2 + (x2 - x1) * 0.18, x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCursor(ctx: CanvasRenderingContext2D, pose: Pose, layout: Layout, pal: Palette): void {
  const { cell, ox, oy } = layout;
  const rad = Math.max(5.5, Math.min(14, cell * 0.42));
  ctx.save();
  ctx.translate(ox + (pose.col + 0.5) * cell, oy + (pose.row + 0.5) * cell);
  ctx.rotate(pose.facing * (Math.PI / 2));
  ctx.fillStyle = pal.gold;
  ctx.strokeStyle = pal.surface;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rad, 0); ctx.lineTo(-rad * 0.75, -rad * 0.72);
  ctx.lineTo(-rad * 0.35, 0); ctx.lineTo(-rad * 0.75, rad * 0.72);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

const CANVAS_STYLE = {
  display: 'block', width: '100%', maxWidth: `${CANVAS_W}px`, aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
  border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)',
} as const;

/** HiDPI Canvas2D board renderer for Monkey Map trail, wraps, and cursor pose. */
export function BoardCanvas({ board, frame, faceSize }: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CANVAS_W * dpr);
    canvas.height = Math.round(CANVAS_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pal = readPalette(canvas);
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const layout = computeLayout(board);
    drawTiles(ctx, board, layout, pal);
    if (faceSize !== undefined && faceSize > 0) drawFaceBorders(ctx, board, faceSize, layout, pal);
    drawTrail(ctx, frame, layout, pal);
    drawWrapArc(ctx, frame, layout, pal);
    drawCursor(ctx, frame.pose, layout, pal);
  }, [board, frame, faceSize]);
  return <canvas ref={canvasRef} style={CANVAS_STYLE} aria-label="Monkey Map board visualization" />;
}
