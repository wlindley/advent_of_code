import { useEffect, useRef } from 'react';
import type { HeightMap, HillClimbTraceFrame, ReverseBfsField } from '../index';

const CANVAS_W = 720;
const CANVAS_H = 380;
const PAD = 16;

interface Palette {
  readonly surface: string;
  readonly border: string;
  readonly accent: string;
  readonly ok: string;
  readonly gold: string;
}

interface Layout {
  readonly cellSize: number;
  readonly originX: number;
  readonly originY: number;
}

export interface ElevationCanvasProps {
  readonly map: HeightMap;
  readonly field: ReverseBfsField;
  readonly frame: HillClimbTraceFrame;
  readonly winningPath: readonly number[];
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
    ok: cssVar(s, '--ok', '#1a7f37'),
    gold: cssVar(s, '--gold', '#9a6700'),
  };
}

function computeLayout(map: HeightMap): Layout {
  const cellSize = Math.min((CANVAS_W - PAD * 2) / map.cols, (CANVAS_H - PAD * 2) / map.rows);
  return {
    cellSize,
    originX: (CANVAS_W - map.cols * cellSize) / 2,
    originY: (CANVAS_H - map.rows * cellSize) / 2,
  };
}

function elevationColor(height: number): string {
  const t = height / 25;
  return `rgb(${Math.round(232 - t * 34)}, ${Math.round(244 - t * 112)}, ${Math.round(236 - t * 144)})`;
}

function drawCells(
  ctx: CanvasRenderingContext2D, map: HeightMap, field: ReverseBfsField,
  frame: HillClimbTraceFrame, layout: Layout, palette: Palette,
): void {
  const { cellSize, originX, originY } = layout;
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      const idx = r * map.cols + c;
      const x = originX + c * cellSize;
      const y = originY + r * cellSize;
      ctx.fillStyle = elevationColor(map.heightAtIndex(idx));
      ctx.fillRect(x, y, cellSize + 0.35, cellSize + 0.35);
      const dist = field.distanceAt(idx);
      if (dist !== null && dist <= frame.distance) {
        ctx.fillStyle = dist === frame.distance ? 'rgba(9, 105, 218, 0.72)' : 'rgba(9, 105, 218, 0.24)';
        ctx.fillRect(x, y, cellSize + 0.35, cellSize + 0.35);
      }
    }
  }
  if (cellSize >= 10) {
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 0.75;
    ctx.strokeRect(originX, originY, map.cols * cellSize, map.rows * cellSize);
  }
}

function drawWinningPath(
  ctx: CanvasRenderingContext2D, map: HeightMap, winningPath: readonly number[],
  layout: Layout, palette: Palette,
): void {
  if (winningPath.length < 2) return;
  const { cellSize, originX, originY } = layout;
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = Math.max(2, Math.min(5, cellSize * 0.24));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < winningPath.length; i += 1) {
    const [r, c] = map.coordsOf(winningPath[i]!);
    const cx = originX + (c + 0.5) * cellSize;
    const cy = originY + (r + 0.5) * cellSize;
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();
}

function drawBeacon(
  ctx: CanvasRenderingContext2D, map: HeightMap, index: number,
  label: string, color: string, layout: Layout,
): void {
  const [r, c] = map.coordsOf(index);
  const { cellSize, originX, originY } = layout;
  const cx = originX + (c + 0.5) * cellSize;
  const cy = originY + (r + 0.5) * cellSize;
  const radius = Math.max(4, Math.min(13, cellSize * 0.38));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  if (cellSize >= 12) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.max(9, Math.round(radius * 1.15))}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + 0.5);
  }
}

const CANVAS_STYLE = {
  display: 'block',
  width: '100%',
  maxWidth: `${CANVAS_W}px`,
  aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--surface)',
} as const;

/** HiDPI Canvas2D elevation map showing reverse-BFS wavefront and winning path. */
export function ElevationCanvas({ map, field, frame, winningPath }: ElevationCanvasProps) {
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
    const layout = computeLayout(map);
    drawCells(ctx, map, field, frame, layout, palette);
    if (frame.winningStartReached) drawWinningPath(ctx, map, winningPath, layout, palette);
    drawBeacon(ctx, map, map.startIndex, 'S', palette.ok, layout);
    if (frame.winningStartIndex !== null && frame.winningStartIndex !== map.startIndex) {
      drawBeacon(ctx, map, frame.winningStartIndex, 'a', palette.gold, layout);
    }
    drawBeacon(ctx, map, map.goalIndex, 'E', palette.accent, layout);
  }, [map, field, frame, winningPath]);

  return (
    <div>
      <canvas ref={canvasRef} aria-label="Elevation grid and reverse BFS wavefront" style={CANVAS_STYLE} />
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>S: Start</span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>E: Goal &amp; Wavefront</span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Gold: Shortest Path</span>
      </div>
    </div>
  );
}
