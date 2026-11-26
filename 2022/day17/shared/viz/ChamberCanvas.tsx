import { useEffect, useRef } from 'react';
import { CHAMBER_WIDTH, type PyroclasticTraceFrame, type SettledRockSnapshot, TRACE_WINDOW_ROWS } from '../index';

const CANVAS_W = 460;
const CANVAS_H = 516;
const CELL = 20;
const ORIGIN_X = 160;
const ORIGIN_Y = 16;

interface Palette {
  readonly surface: string;
  readonly border: string;
  readonly text: string;
  readonly muted: string;
  readonly gold: string;
}

export interface ChamberCanvasProps {
  readonly frame: PyroclasticTraceFrame;
}

function cssVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  return styles.getPropertyValue(name).trim() || fallback;
}

function readPalette(el: HTMLElement): Palette {
  const s = getComputedStyle(el);
  return {
    surface: cssVar(s, '--surface', '#ffffff'),
    border: cssVar(s, '--border', '#d0d7de'),
    text: cssVar(s, '--text', '#1f2328'),
    muted: cssVar(s, '--muted', '#59636e'),
    gold: cssVar(s, '--gold', '#9a6700'),
  };
}

function isLastRockCell(rock: SettledRockSnapshot | null, chamberY: number, bit: number): boolean {
  if (!rock) return false;
  const dy = chamberY - rock.bottomY;
  if (dy < 0 || dy >= 4) return false;
  return (((rock.mask >>> (dy * 8)) & bit) !== 0);
}

function drawHatchedFloor(ctx: CanvasRenderingContext2D, yPx: number, palette: Palette): void {
  const width = CHAMBER_WIDTH * CELL;
  ctx.fillStyle = '#475569';
  ctx.fillRect(ORIGIN_X, yPx, width, CELL);
  ctx.strokeStyle = palette.surface;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 4; x < width + CELL; x += 10) {
    ctx.moveTo(ORIGIN_X + Math.max(0, x - CELL), yPx + Math.min(CELL, x));
    ctx.lineTo(ORIGIN_X + Math.min(width, x), yPx + Math.max(0, x - width));
  }
  ctx.stroke();
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  xPx: number,
  yPx: number,
  filled: boolean,
  reachable: boolean,
  highlighted: boolean,
  palette: Palette,
): void {
  if (highlighted) ctx.fillStyle = palette.gold;
  else if (filled) ctx.fillStyle = '#334155';
  else if (reachable) ctx.fillStyle = 'rgba(8, 145, 178, 0.14)';
  else ctx.fillStyle = 'rgba(100, 116, 139, 0.22)';
  ctx.fillRect(xPx + 0.5, yPx + 0.5, CELL - 1, CELL - 1);
  if (filled || highlighted) {
    ctx.strokeStyle = highlighted ? palette.text : '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(xPx + 0.5, yPx + 0.5, CELL - 1, CELL - 1);
  }
}

function drawChamberRows(ctx: CanvasRenderingContext2D, frame: PyroclasticTraceFrame, palette: Palette): void {
  const { windowRows, reachableRows, windowBaseY } = frame.window;
  const absOffset = frame.towerHeight - BigInt(frame.chamberHeight);
  const absBaseY = absOffset + BigInt(windowBaseY);

  for (let i = 0; i < windowRows.length; i += 1) {
    const yPx = ORIGIN_Y + (TRACE_WINDOW_ROWS - 1 - i) * CELL;
    if (i === 0 && absBaseY === 0n) {
      drawHatchedFloor(ctx, yPx, palette);
      continue;
    }
    const rowMask = windowRows[i]!;
    const reachMask = reachableRows[i]!;
    const chamberY = windowBaseY + i;
    for (let col = 0; col < CHAMBER_WIDTH; col += 1) {
      const bit = 1 << (6 - col);
      const xPx = ORIGIN_X + col * CELL;
      drawCell(ctx, xPx, yPx, (rowMask & bit) !== 0, (reachMask & bit) !== 0, isLastRockCell(frame.lastRock, chamberY, bit), palette);
    }
  }
}

function drawWallsAndRuler(ctx: CanvasRenderingContext2D, frame: PyroclasticTraceFrame, palette: Palette): void {
  const chamberW = CHAMBER_WIDTH * CELL;
  const chamberH = TRACE_WINDOW_ROWS * CELL;
  ctx.fillStyle = palette.text;
  ctx.fillRect(ORIGIN_X - 4, ORIGIN_Y, 4, chamberH);
  ctx.fillRect(ORIGIN_X + chamberW, ORIGIN_Y, 4, chamberH);

  const absBaseY = frame.towerHeight - BigInt(frame.chamberHeight) + BigInt(frame.window.windowBaseY);
  const count = frame.window.windowRows.length;
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < count; i += 1) {
    if (i !== 0 && i !== count - 1 && i % 4 !== 0) continue;
    const yMid = ORIGIN_Y + (TRACE_WINDOW_ROWS - 1 - i + 0.5) * CELL;
    ctx.strokeStyle = palette.border;
    ctx.beginPath();
    ctx.moveTo(ORIGIN_X - 9, yMid);
    ctx.lineTo(ORIGIN_X - 4, yMid);
    ctx.stroke();
    ctx.fillStyle = i === count - 1 ? palette.text : palette.muted;
    ctx.fillText((absBaseY + BigInt(i)).toLocaleString(), ORIGIN_X - 12, yMid);
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

/** HiDPI Canvas2D 7-column chamber view showing top 24 rows, reachable cavity, and BigInt height ruler. */
export function ChamberCanvas({ frame }: ChamberCanvasProps) {
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
    drawChamberRows(ctx, frame, palette);
    drawWallsAndRuler(ctx, frame, palette);
  }, [frame]);

  return <canvas ref={canvasRef} aria-label="Pyroclastic rock chamber cross-section" style={CANVAS_STYLE} />;
}
