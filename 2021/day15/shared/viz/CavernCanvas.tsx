import { useEffect, useRef } from 'react';
import type { CavernTraceFrame } from '../index';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const PADDING = 16;

type Rgb = readonly [number, number, number];

interface CanvasPalette {
  readonly surface: string; readonly border: string; readonly text: string;
  readonly accent: string; readonly gold: string; readonly ok: string;
  readonly surfaceRgb: Rgb; readonly mutedRgb: Rgb; readonly accentRgb: Rgb;
}

function parseCssRgb(css: string, fallback: Rgb): Rgb {
  const hex = /^#([0-9a-f]{6})$/i.exec(css.trim());
  if (hex !== null) {
    const n = Number.parseInt(hex[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(css.trim());
  return rgb !== null ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : fallback;
}

function resolvePalette(canvas: HTMLCanvasElement): CanvasPalette {
  const s = getComputedStyle(canvas);
  const tok = (name: string, fb: string): string => s.getPropertyValue(name).trim() || fb;
  const surface = tok('--surface', '#ffffff');
  const muted = tok('--muted', '#59636e');
  const accent = tok('--accent', '#0969da');
  return {
    surface,
    border: tok('--border', '#d0d7de'),
    text: tok('--text', '#1f2328'),
    accent,
    gold: tok('--gold', '#9a6700'),
    ok: tok('--ok', '#1a7f37'),
    surfaceRgb: parseCssRgb(surface, [255, 255, 255]),
    mutedRgb: parseCssRgb(muted, [89, 99, 110]),
    accentRgb: parseCssRgb(accent, [9, 105, 218]),
  };
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}

function cellColor(risk: number, dist: number, frame: CavernTraceFrame, p: CanvasPalette): Rgb {
  const riskT = (risk - 1) / 8;
  if (frame.phase === 'wavefront' && dist === frame.riskThreshold) {
    return mixRgb(p.accentRgb, p.surfaceRgb, 0.12);
  }
  if (dist <= frame.riskThreshold) return mixRgb(p.surfaceRgb, p.accentRgb, 0.16 + riskT * 0.24);
  return mixRgb(p.surfaceRgb, p.mutedRgb, 0.06 + riskT * 0.34);
}

function paintHeatmap(
  ctx: CanvasRenderingContext2D, frame: CavernTraceFrame, p: CanvasPalette,
  ox: number, oy: number, cell: number,
): void {
  const { map, distances } = frame.result;
  const off = document.createElement('canvas');
  off.width = map.cols;
  off.height = map.rows;
  const offCtx = off.getContext('2d');
  if (offCtx === null) return;
  const img = offCtx.createImageData(map.cols, map.rows);
  for (let i = 0; i < map.cellCount; i += 1) {
    const [r, g, b] = cellColor(map.riskLevels[i]!, distances[i]!, frame, p);
    const k = i * 4;
    img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
  }
  offCtx.putImageData(img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, ox, oy, map.cols * cell, map.rows * cell);
  ctx.restore();
}

function drawGridAndDigits(
  ctx: CanvasRenderingContext2D, frame: CavernTraceFrame, p: CanvasPalette,
  ox: number, oy: number, cell: number,
): void {
  const { map, distances } = frame.result;
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 0.7;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.max(10, Math.floor(cell * 0.44))}px ui-monospace, monospace`;
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      const x = ox + c * cell;
      const y = oy + r * cell;
      ctx.strokeRect(x, y, cell, cell);
      const i = r * map.cols + c;
      const isFrontier = frame.phase === 'wavefront' && distances[i] === frame.riskThreshold;
      ctx.fillStyle = isFrontier ? p.surface : p.text;
      ctx.fillText(String(map.riskLevels[i]!), x + cell / 2, y + cell / 2);
    }
  }
}

function drawPathAndEndpoints(
  ctx: CanvasRenderingContext2D, frame: CavernTraceFrame, p: CanvasPalette,
  ox: number, oy: number, cell: number,
): void {
  const { map, pathIndices } = frame.result;
  if (frame.pathRevealCount > 1) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let k = 0; k < frame.pathRevealCount; k += 1) {
      const idx = pathIndices[k]!;
      const px = ox + ((idx % map.cols) + 0.5) * cell;
      const py = oy + (Math.floor(idx / map.cols) + 0.5) * cell;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = p.surface; ctx.lineWidth = Math.max(4, cell * 0.36); ctx.stroke();
    ctx.strokeStyle = p.gold; ctx.lineWidth = Math.max(2, cell * 0.22); ctx.stroke();
    ctx.restore();
  }
  const rad = Math.max(3, Math.min(7, cell * 0.28));
  ctx.fillStyle = p.ok;
  ctx.beginPath(); ctx.arc(ox + 0.5 * cell, oy + 0.5 * cell, rad, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = frame.goalReached ? p.gold : p.text;
  ctx.beginPath(); ctx.arc(ox + (map.cols - 0.5) * cell, oy + (map.rows - 0.5) * cell, rad, 0, Math.PI * 2); ctx.fill();
}

function renderCavern(canvas: HTMLCanvasElement, frame: CavernTraceFrame): void {
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const p = resolvePalette(canvas);
  ctx.fillStyle = p.surface; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = p.border; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1);
  const { rows, cols } = frame.result.map;
  const cell = Math.min((CANVAS_WIDTH - PADDING * 2) / cols, (CANVAS_HEIGHT - PADDING * 2) / rows);
  const ox = (CANVAS_WIDTH - cell * cols) / 2;
  const oy = (CANVAS_HEIGHT - cell * rows) / 2;
  paintHeatmap(ctx, frame, p, ox, oy, cell);
  if (cell >= 20) drawGridAndDigits(ctx, frame, p, ox, oy, cell);
  drawPathAndEndpoints(ctx, frame, p, ox, oy, cell);
}

/** HiDPI Canvas 2D renderer for cavern risk heatmap, Dijkstra wavefront, and optimal path. */
export function CavernCanvas({ frame }: { readonly frame: CavernTraceFrame }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => { if (canvasRef.current !== null) renderCavern(canvasRef.current, frame); }, [frame]);
  const { rows, cols } = frame.result.map;
  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} aria-label={`Cavern ${rows} by ${cols} risk heatmap and shortest path`} />;
}
