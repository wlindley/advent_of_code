import { useEffect, useRef } from 'react';
import type { CompactionMove } from '../compaction';
import { fileColorRgb } from './palette';

export interface DiskPlatterCanvasProps {
  readonly blocks: ArrayLike<number>;
  readonly appliedMoves: number;
  readonly lastMove: CompactionMove | null;
}

interface PlatterDims {
  readonly cols: number;
  readonly rows: number;
  readonly width: number;
  readonly height: number;
}

function computeDims(totalBlocks: number): PlatterDims {
  const safe = Math.max(1, totalBlocks);
  const cols = Math.min(360, Math.max(40, Math.ceil(Math.sqrt(safe * 3))));
  const rows = Math.max(1, Math.ceil(safe / cols));
  const width = 760;
  const height = Math.max(150, Math.min(420, Math.round((width * rows) / cols)));
  return { cols, rows, width, height };
}

function buildHeatmapBuffer(blocks: ArrayLike<number>, cols: number, rows: number): ImageData {
  const image = new ImageData(cols, rows);
  const data = image.data;
  const total = cols * rows;
  for (let i = 0; i < total; i += 1) {
    const off = i * 4;
    if (i >= blocks.length) {
      data[off] = 255;
      data[off + 1] = 255;
      data[off + 2] = 255;
      data[off + 3] = 255;
    } else {
      const [r, g, b] = fileColorRgb(blocks[i]!);
      data[off] = r;
      data[off + 1] = g;
      data[off + 2] = b;
      data[off + 3] = 255;
    }
  }
  return image;
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  start: number,
  end: number,
  dims: PlatterDims,
  color: string,
): void {
  const cellW = dims.width / dims.cols;
  const cellH = dims.height / dims.rows;
  const r0 = Math.floor(start / dims.cols);
  const r1 = Math.floor(Math.max(start, end - 1) / dims.cols);
  const c0 = start % dims.cols;
  const c1 = (Math.max(start, end - 1) % dims.cols) + 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (r0 === r1) {
    ctx.strokeRect(c0 * cellW, r0 * cellH, Math.max(4, (c1 - c0) * cellW), Math.max(4, cellH));
  } else {
    ctx.strokeRect(0, r0 * cellH, dims.width, Math.max(4, (r1 - r0 + 1) * cellH));
  }
}

function paintPlatter(
  canvas: HTMLCanvasElement,
  blocks: ArrayLike<number>,
  lastMove: CompactionMove | null,
): void {
  const dims = computeDims(blocks.length);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(dims.width * dpr);
  canvas.height = Math.round(dims.height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const offscreen = document.createElement('canvas');
  offscreen.width = dims.cols;
  offscreen.height = dims.rows;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  offCtx.putImageData(buildHeatmapBuffer(blocks, dims.cols, dims.rows), 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offscreen, 0, 0, dims.width, dims.height);

  if (lastMove) {
    drawMarker(ctx, lastMove.fromStart, lastMove.fromEnd, dims, '#9a6700');
    drawMarker(ctx, lastMove.toStart, lastMove.toEnd, dims, '#1a7f37');
  }
}

/** HiDPI 2D `ImageData` platter heatmap for large disks (`totalBlocks > 100`). */
export function DiskPlatterCanvas({ blocks, appliedMoves, lastMove }: DiskPlatterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dims = computeDims(blocks.length);

  useEffect(() => {
    if (canvasRef.current) {
      paintPlatter(canvasRef.current, blocks, lastMove);
    }
  }, [blocks, appliedMoves, lastMove]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Disk block platter heatmap (${blocks.length} blocks)`}
      style={{
        width: '100%',
        maxWidth: dims.width,
        aspectRatio: `${dims.width} / ${dims.height}`,
        display: 'block',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    />
  );
}
