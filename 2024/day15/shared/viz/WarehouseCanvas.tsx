import { useEffect, useRef } from 'react';
import {
  type MoveDir,
  TILE_BOX,
  TILE_BOX_LEFT,
  TILE_BOX_RIGHT,
  TILE_WALL,
  type WarehouseFrame,
  type WarehouseSnapshot,
} from '../index';

export interface WarehouseCanvasProps {
  readonly frame: WarehouseFrame;
}

const DIRECTION_ANGLES: Readonly<Record<MoveDir, number>> = {
  '>': 0, 'v': Math.PI / 2, '<': Math.PI, '^': -Math.PI / 2,
};

function computeCellSize(width: number, height: number): number {
  return Math.max(4, Math.min(44, Math.floor(620 / Math.max(width, height))));
}

function drawWall(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
  ctx.fillStyle = '#334155';
  ctx.fillRect(px, py, size, size);
  if (size < 8) return;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(px, py, size, 2);
  ctx.fillRect(px, py, 2, size);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.fillRect(px, py + size - 2, size, 2);
  ctx.fillRect(px + size - 2, py, 2, size);
}

function drawCrate(ctx: CanvasRenderingContext2D, px: number, py: number, w: number, size: number): void {
  const pad = size >= 10 ? 2 : 1;
  ctx.fillStyle = '#d97706';
  ctx.fillRect(px + pad, py + pad, w - pad * 2, size - pad * 2);
  if (size < 10) return;
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.25;
  ctx.strokeRect(px + pad + 0.5, py + pad + 0.5, w - pad * 2 - 1, size - pad * 2 - 1);
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(px + pad + 3, py + pad + 3, w - (pad + 3) * 2, 2);
}

function drawRobotChevron(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  move: MoveDir,
  size: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(DIRECTION_ANGLES[move]);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.5, size * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-radius * 0.25, -radius * 0.38);
  ctx.lineTo(radius * 0.38, 0);
  ctx.lineTo(-radius * 0.25, radius * 0.38);
  ctx.stroke();
  ctx.restore();
}

function drawRobot(ctx: CanvasRenderingContext2D, frame: WarehouseFrame, size: number): void {
  const cx = (frame.snapshot.robotCol + 0.5) * size;
  const cy = (frame.snapshot.robotRow + 0.5) * size;
  const radius = Math.max(2, size * 0.36);

  if (!frame.moved && frame.move !== null) {
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = Math.max(1.5, size * 0.1);
    ctx.beginPath();
    ctx.arc(cx, cy, radius + Math.max(1.5, size * 0.1), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#0891b2';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  if (frame.move !== null && size >= 10) drawRobotChevron(ctx, cx, cy, radius, frame.move, size);
}

function drawGrid(ctx: CanvasRenderingContext2D, snapshot: WarehouseSnapshot, size: number): void {
  for (let r = 0; r < snapshot.height; r += 1) {
    for (let c = 0; c < snapshot.width; c += 1) {
      const px = c * size;
      const py = r * size;
      if (size >= 6) {
        ctx.strokeStyle = 'rgba(31, 35, 40, 0.08)';
        ctx.lineWidth = 0.75;
        ctx.strokeRect(px, py, size, size);
      }
      const tile = snapshot.cellAt(r, c);
      if (tile === TILE_WALL) drawWall(ctx, px, py, size);
      else if (tile === TILE_BOX) drawCrate(ctx, px, py, size, size);
      else if (tile === TILE_BOX_LEFT) drawCrate(ctx, px, py, size * 2, size);
      else if (tile === TILE_BOX_RIGHT) continue;
    }
  }
}

/** HiDPI Canvas 2D renderer for warehouse walls, 1x/2x crates, and directional robot. */
export function WarehouseCanvas({ frame }: WarehouseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { snapshot } = frame;
  const cellSize = computeCellSize(snapshot.width, snapshot.height);
  const width = snapshot.width * cellSize;
  const height = snapshot.height * cellSize;

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
    drawGrid(ctx, snapshot, cellSize);
    drawRobot(ctx, frame, cellSize);
  }, [frame, snapshot, cellSize, width, height]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Warehouse ${snapshot.width}x${snapshot.height} at move ${frame.step} of ${frame.totalMoves}`}
      style={{
        width: '100%',
        maxWidth: width,
        aspectRatio: `${width} / ${height}`,
        display: 'block',
        border: frame.step === frame.totalMoves ? '2px solid var(--gold)' : '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    />
  );
}
