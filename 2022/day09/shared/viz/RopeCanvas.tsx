import { useEffect, useMemo, useRef } from 'react';
import { GridBounds, GridPoint } from '../motionPlan';
import type { RopeTraceFrame } from '../simulation';
import { RopeViewport, type CumulativeTailIndex } from './ropeViewport';

const CANVAS_W = 680;
const CANVAS_H = 460;
const CANVAS_PAD = 24;

interface Palette {
  readonly surface: string;
  readonly border: string;
  readonly text: string;
  readonly accent: string;
  readonly ok: string;
  readonly gold: string;
}

export interface RopeCanvasProps {
  readonly bounds: GridBounds;
  readonly frame: RopeTraceFrame;
  readonly frameIndex: number;
  readonly tailIndex: CumulativeTailIndex;
}

function cssColor(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  return styles.getPropertyValue(name).trim() || fallback;
}

function readPalette(el: HTMLElement): Palette {
  const s = getComputedStyle(el);
  return {
    surface: cssColor(s, '--surface', '#ffffff'),
    border: cssColor(s, '--border', '#d0d7de'),
    text: cssColor(s, '--text', '#1f2328'),
    accent: cssColor(s, '--accent', '#0969da'),
    ok: cssColor(s, '--ok', '#1a7f37'),
    gold: cssColor(s, '--gold', '#9a6700'),
  };
}

function drawGridlines(ctx: CanvasRenderingContext2D, vp: RopeViewport, palette: Palette): void {
  if (!vp.showGridlines) return;
  const size = vp.cellSize;
  const topLeft = vp.cellCenter(new GridPoint(vp.bounds.minX, vp.bounds.maxY));
  const left = topLeft.x - size / 2;
  const top = topLeft.y - size / 2;
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 0; c <= vp.bounds.width; c += 1) {
    ctx.moveTo(left + c * size, top);
    ctx.lineTo(left + c * size, top + vp.bounds.height * size);
  }
  for (let r = 0; r <= vp.bounds.height; r += 1) {
    ctx.moveTo(left, top + r * size);
    ctx.lineTo(left + vp.bounds.width * size, top + r * size);
  }
  ctx.stroke();
}

function drawTailTrail(
  ctx: CanvasRenderingContext2D,
  vp: RopeViewport,
  tailIndex: CumulativeTailIndex,
  frameIndex: number,
  palette: Palette,
): void {
  const size = vp.cellSize;
  const priorEnd = frameIndex > 0 ? (tailIndex.prefixEnds[frameIndex - 1] ?? 0) : 0;
  const currEnd = tailIndex.prefixEnds[frameIndex] ?? 0;
  const inset = size >= 6 ? Math.max(1, size * 0.08) : 0;
  const drawSize = Math.max(1.5, size - inset * 2);
  for (let i = 0; i < currEnd; i += 1) {
    const center = vp.cellCenter(tailIndex.cells[i]!);
    const isNew = i >= priorEnd;
    ctx.fillStyle = isNew ? 'rgba(6, 182, 212, 0.45)' : 'rgba(26, 127, 55, 0.24)';
    ctx.fillRect(center.x - drawSize / 2, center.y - drawSize / 2, drawSize, drawSize);
    if (size >= 8) {
      ctx.strokeStyle = isNew ? '#0891b2' : palette.ok;
      ctx.lineWidth = isNew ? 1.75 : 1;
      ctx.strokeRect(center.x - drawSize / 2, center.y - drawSize / 2, drawSize, drawSize);
    }
  }
}

function drawOriginBeacon(ctx: CanvasRenderingContext2D, vp: RopeViewport, palette: Palette): void {
  const center = vp.cellCenter(GridPoint.ORIGIN);
  const radius = Math.max(4, Math.min(vp.cellSize * 0.38, 16));
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  if (vp.cellSize >= 12) {
    ctx.fillStyle = palette.gold;
    ctx.font = `700 ${Math.max(10, Math.round(vp.cellSize * 0.4))}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('s', center.x, center.y + 0.5);
  }
}

function drawRopeLinks(ctx: CanvasRenderingContext2D, vp: RopeViewport, frame: RopeTraceFrame, palette: Palette): void {
  ctx.strokeStyle = palette.text;
  ctx.lineWidth = Math.max(2, Math.min(4, vp.cellSize * 0.14));
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = frame.knotCount - 1; i >= 0; i -= 1) {
    const pt = vp.cellCenter(frame.knots[i]!);
    if (i === frame.knotCount - 1) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
}

function drawRopeKnots(ctx: CanvasRenderingContext2D, vp: RopeViewport, frame: RopeTraceFrame, palette: Palette): void {
  const count = frame.knotCount;
  const radius = Math.max(4, Math.min(vp.cellSize * 0.34, 15));
  for (let i = count - 1; i >= 0; i -= 1) {
    const pt = vp.cellCenter(frame.knots[i]!);
    ctx.fillStyle = i === 0 ? palette.accent : i === count - 1 ? palette.ok : palette.text;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (vp.cellSize >= 14) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.max(10, Math.round(radius * 1.15))}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i === 0 ? 'H' : i === count - 1 ? 'T' : String(i), pt.x, pt.y + 0.5);
    }
  }
}

/** HiDPI Canvas2D renderer for the Y-up rope lattice, cumulative tail trail, and knots. */
export function RopeCanvas({ bounds, frame, frameIndex, tailIndex }: RopeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vp = useMemo(() => new RopeViewport(bounds, CANVAS_W, CANVAS_H, CANVAS_PAD), [bounds]);

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
    drawGridlines(ctx, vp, palette);
    drawTailTrail(ctx, vp, tailIndex, frameIndex, palette);
    drawOriginBeacon(ctx, vp, palette);
    drawRopeLinks(ctx, vp, frame, palette);
    drawRopeKnots(ctx, vp, frame, palette);
  }, [vp, tailIndex, frameIndex, frame]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Rope bridge lattice visualization"
      style={{ display: 'block', width: '100%', maxWidth: `${CANVAS_W}px`, aspectRatio: `${CANVAS_W}/${CANVAS_H}`, border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', marginTop: '0.6rem' }}
    />
  );
}
