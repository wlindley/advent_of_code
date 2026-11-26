import { useEffect, useRef } from 'react';
import type { RedoubtSnapshot, TorusSpace } from '../index';

export interface RedoubtCanvasProps {
  readonly snapshot: RedoubtSnapshot;
  readonly showQuadrants?: boolean;
}

const CELL_COLORS = ['#0891b2', '#059669', '#d97706'] as const;
const MIDLINE_FILL = 'rgba(100, 116, 139, 0.14)';
const GRID_STROKE = 'rgba(31, 35, 40, 0.1)';

function computeCellSize(space: TorusSpace): number {
  const maxDim = Math.max(space.width, space.height);
  return Math.max(4, Math.min(44, Math.floor(620 / maxDim)));
}

function densityColor(density: number): string {
  if (density === 1) return CELL_COLORS[0];
  if (density === 2) return CELL_COLORS[1];
  return CELL_COLORS[2];
}

function drawCrosshairOverlay(
  ctx: CanvasRenderingContext2D,
  space: TorusSpace,
  cellSize: number,
): void {
  const width = space.width * cellSize;
  const height = space.height * cellSize;
  ctx.fillStyle = MIDLINE_FILL;
  ctx.fillRect(space.midX * cellSize, 0, cellSize, height);
  ctx.fillRect(0, space.midY * cellSize, width, cellSize);

  ctx.save();
  ctx.strokeStyle = 'rgba(31, 35, 40, 0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(space.midX * cellSize + 0.5, 0.5, cellSize - 1, height - 1);
  ctx.strokeRect(0.5, space.midY * cellSize + 0.5, width - 1, cellSize - 1);
  ctx.restore();
}

function drawQuadrantLabels(
  ctx: CanvasRenderingContext2D,
  space: TorusSpace,
  cellSize: number,
): void {
  if (space.width < 3 || space.height < 3) return;
  const pad = Math.max(6, Math.round(cellSize * 0.35));
  const leftW = space.midX * cellSize;
  const rightX = (space.midX + 1) * cellSize;
  const topY = pad + 11;
  const botY = space.height * cellSize - pad;

  ctx.save();
  ctx.font = '700 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = 'rgba(31, 35, 40, 0.52)';
  ctx.textAlign = 'left';
  ctx.fillText('Q1', pad, topY);
  ctx.fillText('Q3', pad, botY);
  ctx.textAlign = 'right';
  ctx.fillText('Q2', leftW + cellSize + (space.width - 1 - space.midX) * cellSize - pad, topY);
  ctx.fillText('Q4', rightX + (space.width - 1 - space.midX) * cellSize - pad, botY);
  ctx.restore();
}

function drawCells(
  ctx: CanvasRenderingContext2D,
  snapshot: RedoubtSnapshot,
  cellSize: number,
): void {
  const { space } = snapshot;
  const showLabels = space.width <= 25 && cellSize >= 14;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.max(10, Math.round(cellSize * 0.48))}px ui-monospace, monospace`;

  for (let y = 0; y < space.height; y += 1) {
    for (let x = 0; x < space.width; x += 1) {
      const px = x * cellSize;
      const py = y * cellSize;
      if (cellSize >= 6) {
        ctx.strokeStyle = GRID_STROKE;
        ctx.lineWidth = 0.75;
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
      const density = snapshot.densityAt(x, y);
      if (density === 0) continue;
      const inset = cellSize >= 8 ? 1 : 0;
      ctx.fillStyle = densityColor(density);
      ctx.fillRect(px + inset, py + inset, cellSize - inset * 2, cellSize - inset * 2);
      if (showLabels) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(density), px + cellSize / 2, py + cellSize / 2);
      }
    }
  }
}

/** HiDPI Canvas 2D density map for a Restroom Redoubt simulation snapshot. */
export function RedoubtCanvas({ snapshot, showQuadrants = false }: RedoubtCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { space } = snapshot;
  const cellSize = computeCellSize(space);
  const width = space.width * cellSize;
  const height = space.height * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    if (showQuadrants) drawCrosshairOverlay(ctx, space, cellSize);
    drawCells(ctx, snapshot, cellSize);
    if (showQuadrants) drawQuadrantLabels(ctx, space, cellSize);
  }, [snapshot, space, showQuadrants, cellSize, width, height]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Restroom Redoubt ${space.width}x${space.height} grid at ${snapshot.second}s`}
      style={{
        width: '100%',
        maxWidth: width,
        aspectRatio: `${width} / ${height}`,
        display: 'block',
        border: snapshot.highlight ? '2px solid var(--gold)' : '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    />
  );
}
