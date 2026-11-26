import { useEffect, useRef } from 'react';
import { type ByteCoord, type RamRunSnapshot, UNVISITED } from '../index';

export interface RamRunCanvasProps {
  readonly snapshot: RamRunSnapshot;
}

function computeCellSize(gridSize: number): number {
  return Math.max(4, Math.min(48, Math.floor(620 / gridSize)));
}

function waveColor(dist: number, maxWave: number): string {
  const t = maxWave > 0 ? Math.min(1, dist / maxWave) : 0;
  const r = Math.round(103 + (79 - 103) * t);
  const g = Math.round(232 + (70 - 232) * t);
  const b = Math.round(249 + (229 - 249) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawCells(ctx: CanvasRenderingContext2D, snapshot: RamRunSnapshot, cellSize: number): void {
  const size = snapshot.memory.gridSize;
  const maxWave = Math.max(0, snapshot.maxWaveDistance);
  const inset = cellSize >= 8 ? 1 : 0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x * cellSize;
      const py = y * cellSize;
      if (cellSize >= 6) {
        ctx.strokeStyle = 'rgba(31, 35, 40, 0.1)';
        ctx.lineWidth = 0.75;
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
      if (snapshot.isCorruptedAt(x, y)) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + inset, py + inset, cellSize - inset * 2, cellSize - inset * 2);
      } else {
        const dist = snapshot.distanceAt(x, y);
        if (dist !== UNVISITED) {
          ctx.fillStyle = waveColor(dist, maxWave);
          ctx.fillRect(px + inset, py + inset, cellSize - inset * 2, cellSize - inset * 2);
        }
      }
    }
  }
}

function drawEndpoint(
  ctx: CanvasRenderingContext2D,
  coord: ByteCoord,
  cellSize: number,
  color: string,
  label: string,
): void {
  const inset = cellSize >= 8 ? 1 : 0;
  const px = coord.x * cellSize + inset;
  const py = coord.y * cellSize + inset;
  const side = cellSize - inset * 2;
  ctx.fillStyle = color;
  ctx.fillRect(px, py, side, side);
  if (cellSize >= 12) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.max(9, Math.round(cellSize * 0.5))}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, coord.x * cellSize + cellSize / 2, coord.y * cellSize + cellSize / 2);
  }
}

function drawPath(ctx: CanvasRenderingContext2D, path: readonly ByteCoord[], cellSize: number): void {
  if (path.length < 2) return;
  ctx.save();
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = Math.max(2, cellSize * 0.28);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < path.length; i += 1) {
    const pt = path[i]!;
    const cx = (pt.x + 0.5) * cellSize;
    const cy = (pt.y + 0.5) * cellSize;
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.restore();
}

function drawSpecialBytes(ctx: CanvasRenderingContext2D, snapshot: RamRunSnapshot, cellSize: number): void {
  if (snapshot.latestByte) {
    const { x, y } = snapshot.latestByte;
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x * cellSize + 1, y * cellSize + 1, Math.max(2, cellSize - 2), Math.max(2, cellSize - 2));
  }
  if (snapshot.blockingByte) {
    const { x, y } = snapshot.blockingByte;
    const px = x * cellSize;
    const py = y * cellSize;
    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = Math.max(1.5, cellSize * 0.14);
    ctx.strokeRect(px + 1, py + 1, Math.max(2, cellSize - 2), Math.max(2, cellSize - 2));
    ctx.beginPath();
    ctx.moveTo(px + 2, py + 2);
    ctx.lineTo(px + cellSize - 2, py + cellSize - 2);
    ctx.moveTo(px + cellSize - 2, py + 2);
    ctx.lineTo(px + 2, py + cellSize - 2);
    ctx.stroke();
    ctx.restore();
  }
}

/** HiDPI Canvas 2D renderer for RAM Run byte corruption, BFS wave, and shortest path. */
export function RamRunCanvas({ snapshot }: RamRunCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const size = snapshot.memory.gridSize;
  const cellSize = computeCellSize(size);
  const width = size * cellSize;
  const height = size * cellSize;

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
    drawCells(ctx, snapshot, cellSize);
    drawEndpoint(ctx, { x: 0, y: 0 }, cellSize, '#059669', 'S');
    drawEndpoint(ctx, { x: size - 1, y: size - 1 }, cellSize, '#e11d48', 'E');
    drawPath(ctx, snapshot.path, cellSize);
    drawSpecialBytes(ctx, snapshot, cellSize);
  }, [snapshot, size, cellSize, width, height]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`RAM Run ${size}x${size} grid (${snapshot.phase}, ${snapshot.fallenCount} bytes)`}
      style={{
        width: '100%',
        maxWidth: width,
        aspectRatio: `${width} / ${height}`,
        display: 'block',
        border: snapshot.phase === 'complete' && snapshot.reachable ? '2px solid var(--gold)' : '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    />
  );
}
