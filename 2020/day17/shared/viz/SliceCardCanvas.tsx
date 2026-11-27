import { useEffect, useRef } from 'react';
import type { CellVisualState, PocketDimensionCount, PocketSliceSnapshot } from '../index';

export interface SliceCardCanvasProps {
  readonly slice: PocketSliceSnapshot;
  readonly dimensions: PocketDimensionCount;
}

interface Palette {
  readonly bg: string;
  readonly surface: string;
  readonly border: string;
  readonly accent: string;
  readonly ok: string;
  readonly err: string;
  readonly gold: string;
}

function readToken(styles: CSSStyleDeclaration, token: string, fallback: string): string {
  const val = styles.getPropertyValue(token).trim();
  return val.length > 0 ? val : fallback;
}

function resolvePalette(canvas: HTMLCanvasElement): Palette {
  const s = getComputedStyle(canvas);
  return {
    bg: readToken(s, '--bg', '#f6f8fa'),
    surface: readToken(s, '--surface', '#ffffff'),
    border: readToken(s, '--border', '#d0d7de'),
    accent: readToken(s, '--accent', '#0969da'),
    ok: readToken(s, '--ok', '#1a7f37'),
    err: readToken(s, '--err', '#cf222e'),
    gold: readToken(s, '--gold', '#9a6700'),
  };
}

function computeCellSize(slice: PocketSliceSnapshot): number {
  const span = Math.max(slice.width, slice.height);
  return Math.max(5, Math.min(18, Math.floor(176 / span)));
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: number,
  state: CellVisualState,
  palette: Palette,
): void {
  if (state === 1) {
    ctx.fillStyle = palette.accent;
    ctx.fillRect(x, y, side, side);
    return;
  }
  if (state === 2) {
    ctx.fillStyle = palette.ok;
    ctx.fillRect(x, y, side, side);
    return;
  }
  if (state === 3) {
    ctx.fillStyle = palette.surface;
    ctx.fillRect(x, y, side, side);
    ctx.strokeStyle = palette.err;
    ctx.lineWidth = Math.max(1.25, side * 0.18);
    ctx.strokeRect(x + 0.75, y + 0.75, side - 1.5, side - 1.5);
    return;
  }
  ctx.fillStyle = palette.surface;
  ctx.fillRect(x, y, side, side);
  if (side >= 6) {
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 0.75;
    ctx.strokeRect(x + 0.5, y + 0.5, side - 1, side - 1);
  }
}

function renderSlice(canvas: HTMLCanvasElement, slice: PocketSliceSnapshot): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const palette = resolvePalette(canvas);
  const cellSize = computeCellSize(slice);
  const pad = 6;
  const width = slice.width * cellSize + pad * 2;
  const height = slice.height * cellSize + pad * 2;
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  const gap = cellSize >= 8 ? 1 : 0.4;
  const side = cellSize - gap * 2;
  for (let row = 0; row < slice.height; row += 1) {
    for (let col = 0; col < slice.width; col += 1) {
      drawCell(ctx, pad + col * cellSize + gap, pad + row * cellSize + gap, side, slice.stateAt(col, row), palette);
    }
  }
}

/** HiDPI Canvas 2D card displaying a single (z, w) slice with cycle-diff states. */
export function SliceCardCanvas({ slice, dimensions }: SliceCardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isOriginZ = slice.z === 0;
  const cellSize = computeCellSize(slice);
  const cssWidth = slice.width * cellSize + 12;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) renderSlice(canvas, slice);
  }, [slice]);

  const coordLabel = dimensions === 4 ? `z=${slice.z}, w=${slice.w}` : `z=${slice.z}`;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        padding: '0.55rem',
        borderRadius: '8px',
        background: 'var(--surface)',
        border: isOriginZ ? '2px solid var(--gold)' : '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 600 }}>
        <span style={{ color: isOriginZ ? 'var(--gold)' : 'var(--text)' }}>{coordLabel}</span>
        <span className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{`${slice.activeCount} active`}</span>
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Slice ${coordLabel} with ${slice.activeCount} active cubes`}
        style={{ width: '100%', maxWidth: `${cssWidth}px`, height: 'auto', display: 'block', borderRadius: '4px', margin: '0 auto' }}
      />
    </div>
  );
}
