import { useEffect, useRef } from 'react';
import {
  BLIZZARD_DOWN,
  BLIZZARD_LEFT,
  BLIZZARD_RIGHT,
  BLIZZARD_UP,
  type BasinFrame,
  type BlizzardBasin,
  POPCOUNT_4,
} from '../index';

const CANVAS_W = 760;
const CANVAS_H = 420;
const PAD = 16;

interface Palette {
  readonly bg: string; readonly surface: string; readonly border: string;
  readonly text: string; readonly accent: string; readonly ok: string; readonly gold: string;
}
interface Layout { readonly cell: number; readonly ox: number; readonly oy: number; }
export interface BasinCanvasProps {
  readonly basin: BlizzardBasin;
  readonly frames: readonly BasinFrame[];
  readonly step: number;
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

function maskGlyph(mask: number): string {
  const count = POPCOUNT_4[mask]!;
  if (count > 1) return String(count);
  if (mask === BLIZZARD_UP) return '^';
  if (mask === BLIZZARD_DOWN) return 'v';
  if (mask === BLIZZARD_LEFT) return '<';
  return mask === BLIZZARD_RIGHT ? '>' : '';
}

function drawWalls(ctx: CanvasRenderingContext2D, basin: BlizzardBasin, l: Layout, pal: Palette): void {
  const { cell, ox, oy } = l;
  ctx.fillStyle = pal.surface;
  ctx.fillRect(ox, oy, basin.width * cell, basin.height * cell);
  ctx.fillStyle = '#32383f';
  for (let r = 0; r < basin.height; r += 1) {
    for (let c = 0; c < basin.width; c += 1) {
      const isEdge = r === 0 || r === basin.height - 1 || c === 0 || c === basin.width - 1;
      const isOpen = (r === 0 && c === basin.startCol) || (r === basin.height - 1 && c === basin.endCol);
      if (isEdge && !isOpen) ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
    }
  }
}

function drawBlizzards(
  ctx: CanvasRenderingContext2D,
  basin: BlizzardBasin,
  minute: number,
  l: Layout,
  pal: Palette,
): void {
  const { cell, ox, oy } = l;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.max(9, Math.floor(cell * 0.56))}px ui-monospace, monospace`;
  for (let ir = 0; ir < basin.innerHeight; ir += 1) {
    for (let ic = 0; ic < basin.innerWidth; ic += 1) {
      const mask = basin.blizzardMaskAt(ir, ic, minute);
      if (mask === 0) continue;
      const count = POPCOUNT_4[mask]!;
      const x = ox + (ic + 1) * cell;
      const y = oy + (ir + 1) * cell;
      ctx.fillStyle = `rgba(9, 105, 218, ${Math.min(0.48, 0.14 * count)})`;
      ctx.fillRect(x, y, cell, cell);
      if (cell >= 13) {
        ctx.fillStyle = count > 1 ? pal.text : pal.accent;
        ctx.fillText(maskGlyph(mask), x + cell * 0.5, y + cell * 0.54);
      }
    }
  }
}

function drawTrailAndExpedition(
  ctx: CanvasRenderingContext2D,
  frames: readonly BasinFrame[],
  step: number,
  l: Layout,
  pal: Palette,
): void {
  const { cell, ox, oy } = l;
  ctx.strokeStyle = 'rgba(154, 103, 0, 0.45)';
  ctx.lineWidth = Math.max(1.5, cell * 0.14);
  ctx.beginPath();
  for (let i = 0; i <= step; i += 1) {
    const p = frames[i]!.position;
    const px = ox + (p.col + 0.5) * cell;
    const py = oy + (p.row + 0.5) * cell;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  const cur = frames[step]!.position;
  const cx = ox + (cur.col + 0.5) * cell;
  const cy = oy + (cur.row + 0.5) * cell;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(2.4, cell * 0.34), 0, Math.PI * 2);
  ctx.fillStyle = pal.ok;
  ctx.fill();
  ctx.strokeStyle = pal.gold;
  ctx.lineWidth = Math.max(1.2, cell * 0.1);
  ctx.stroke();
}

const CANVAS_STYLE = {
  display: 'block', width: '100%', maxWidth: `${CANVAS_W}px`, aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
  border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)',
} as const;

/** HiDPI Canvas2D renderer showing Blizzard Basin walls, live blizzards, trail, and expedition. */
export function BasinCanvas({ basin, frames, step }: BasinCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const frame = frames[step];
    if (!canvas || !ctx || !frame) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CANVAS_W * dpr);
    canvas.height = Math.round(CANVAS_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pal = readPalette(canvas);
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const cell = Math.min((CANVAS_W - PAD * 2) / basin.width, (CANVAS_H - PAD * 2) / basin.height);
    const layout: Layout = { cell, ox: (CANVAS_W - basin.width * cell) / 2, oy: (CANVAS_H - basin.height * cell) / 2 };
    drawWalls(ctx, basin, layout, pal);
    drawBlizzards(ctx, basin, frame.minute, layout, pal);
    drawTrailAndExpedition(ctx, frames, step, layout, pal);
  }, [basin, frames, step]);
  return <canvas ref={canvasRef} style={CANVAS_STYLE} aria-label="Blizzard Basin valley grid" />;
}
