import { useEffect, useRef } from 'react';
import type { DishPlatform, TiltDirection } from '../index';

export interface DishCanvasProps {
  readonly platform: DishPlatform;
  readonly highlightColumn?: number;
  readonly activeDirection?: TiltDirection;
  readonly showRowLoads?: boolean;
  readonly maxRowLoad?: number;
  readonly ariaLabel?: string;
}

interface ThemeColors {
  readonly surface: string;
  readonly border: string;
  readonly text: string;
  readonly muted: string;
  readonly accent: string;
  readonly gold: string;
  readonly ok: string;
}

const EDGE_RECTS: Readonly<Record<TiltDirection, (w: number, h: number, t: number) => readonly [number, number, number, number]>> = {
  north: (w, _h, t) => [0, 0, w, t],
  west: (_w, h, t) => [0, 0, t, h],
  south: (w, h, t) => [0, h - t, w, t],
  east: (w, h, t) => [w - t, 0, t, h],
};

function readThemeColors(el: HTMLElement): ThemeColors {
  const s = getComputedStyle(el);
  const v = (k: string, d: string) => s.getPropertyValue(k).trim() || d;
  return {
    surface: v('--surface', '#ffffff'),
    border: v('--border', '#d0d7de'),
    text: v('--text', '#1f2328'),
    muted: v('--muted', '#59636e'),
    accent: v('--accent', '#0969da'),
    gold: v('--gold', '#9a6700'),
    ok: v('--ok', '#1a7f37'),
  };
}

function drawCubeCell(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, theme: ThemeColors): void {
  const pad = Math.max(0.75, cell * 0.1);
  const s = Math.max(1.5, cell - pad * 2);
  const ch = Math.min(s * 0.28, 4);
  const rx = x + pad;
  const ry = y + pad;
  ctx.beginPath();
  ctx.moveTo(rx + ch, ry);
  ctx.lineTo(rx + s - ch, ry);
  ctx.lineTo(rx + s, ry + ch);
  ctx.lineTo(rx + s, ry + s - ch);
  ctx.lineTo(rx + s - ch, ry + s);
  ctx.lineTo(rx + ch, ry + s);
  ctx.lineTo(rx, ry + s - ch);
  ctx.lineTo(rx, ry + ch);
  ctx.closePath();
  ctx.fillStyle = theme.muted;
  ctx.fill();
  ctx.strokeStyle = theme.text;
  ctx.lineWidth = Math.max(0.5, cell * 0.06);
  ctx.stroke();
}

function drawRoundCell(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, weight: number, theme: ThemeColors): void {
  ctx.beginPath();
  ctx.arc(x + cell * 0.5, y + cell * 0.5, Math.max(1.4, cell * 0.36), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(154, 103, 0, ${(0.35 + 0.65 * weight).toFixed(2)})`;
  ctx.fill();
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = Math.max(0.75, cell * 0.08);
  ctx.stroke();
}

function drawRowLoadsPanel(ctx: CanvasRenderingContext2D, platform: DishPlatform, cell: number, gridW: number, barAreaW: number, maxLoad: number, theme: ThemeColors): void {
  const startX = gridW + 8;
  const barW = barAreaW - 14;
  const loads = platform.rowLoads;
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(gridW + 0.5, 0.5, barAreaW - 1, platform.height * cell - 1);
  for (let r = 0; r < platform.height; r += 1) {
    const y = r * cell + Math.max(1, cell * 0.18);
    const h = Math.max(1.5, cell * 0.64);
    const ratio = maxLoad > 0 ? loads[r]! / maxLoad : 0;
    ctx.fillStyle = 'rgba(208, 215, 222, 0.35)';
    ctx.fillRect(startX, y, barW, h);
    if (ratio > 0) {
      ctx.fillStyle = theme.ok;
      ctx.fillRect(startX, y, Math.max(2, barW * ratio), h);
    }
  }
}

function drawDishScene(ctx: CanvasRenderingContext2D, props: DishCanvasProps, cell: number, gridW: number, gridH: number, barAreaW: number, theme: ThemeColors): void {
  const { platform, highlightColumn, activeDirection, showRowLoads, maxRowLoad } = props;
  ctx.fillStyle = theme.surface;
  ctx.fillRect(0, 0, gridW + barAreaW, gridH);
  if (highlightColumn !== undefined && highlightColumn >= 0 && highlightColumn < platform.width) {
    ctx.fillStyle = 'rgba(9, 105, 218, 0.14)';
    ctx.fillRect(highlightColumn * cell, 0, cell, gridH);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(highlightColumn * cell + 0.75, 0.75, Math.max(1, cell - 1.5), gridH - 1.5);
  }
  for (let r = 0; r < platform.height; r += 1) {
    const weight = (platform.height - r) / platform.height;
    for (let c = 0; c < platform.width; c += 1) {
      const ch = platform.cellAt(r, c);
      if (ch === '#') drawCubeCell(ctx, c * cell, r * cell, cell, theme);
      else if (ch === 'O') drawRoundCell(ctx, c * cell, r * cell, cell, weight, theme);
    }
  }
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, gridW - 1, gridH - 1);
  if (activeDirection) {
    const [ex, ey, ew, eh] = EDGE_RECTS[activeDirection](gridW, gridH, 4);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(ex, ey, ew, eh);
  }
  if (showRowLoads) drawRowLoadsPanel(ctx, platform, cell, gridW, barAreaW, maxRowLoad ?? Math.max(1, ...platform.rowLoads), theme);
}

/** HiDPI canvas renderer for parabolic reflector dish platforms and row loads. */
export function DishCanvas(props: DishCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { platform, highlightColumn, activeDirection, showRowLoads, maxRowLoad, ariaLabel } = props;
  const cell = Math.max(4, Math.min(28, Math.floor(560 / Math.max(platform.height, platform.width))));
  const gridW = platform.width * cell;
  const gridH = platform.height * cell;
  const barAreaW = showRowLoads ? 84 : 0;
  const cssW = gridW + barAreaW;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(gridH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawDishScene(ctx, props, cell, gridW, gridH, barAreaW, readThemeColors(canvas));
  }, [platform, highlightColumn, activeDirection, showRowLoads, maxRowLoad, cell, gridW, gridH, barAreaW, cssW]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={ariaLabel ?? `Parabolic reflector dish ${platform.height} by ${platform.width}`}
      style={{ width: '100%', maxWidth: `${cssW}px`, height: 'auto', display: 'block', margin: '0 auto', background: 'var(--surface)' }}
    />
  );
}
