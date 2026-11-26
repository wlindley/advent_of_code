import { useEffect, useRef } from 'react';
import { type GridPoint, type RaceConditionSnapshot, UNREACHABLE } from '../index';

export interface RacetrackCanvasProps {
  readonly snapshot: RaceConditionSnapshot;
}

function computeCellSize(rows: number, cols: number): number {
  return Math.max(3, Math.min(38, Math.floor(620 / Math.max(rows, cols))));
}

function trackColor(dist: number, baseline: number): string {
  if (dist === UNREACHABLE) return '#e2e8f0';
  const denom = baseline > 0 ? baseline : 1;
  const t = Math.min(1, dist / denom);
  const r = Math.round(125 + (99 - 125) * t);
  const g = Math.round(211 + (102 - 211) * t);
  const b = Math.round(252 + (241 - 252) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawGrid(ctx: CanvasRenderingContext2D, snapshot: RaceConditionSnapshot, cellSize: number): void {
  const track = snapshot.field.racetrack;
  const baseline = snapshot.field.baseline;
  const inset = cellSize >= 8 ? 1 : 0;

  for (let r = 0; r < track.rows; r += 1) {
    for (let c = 0; c < track.cols; c += 1) {
      const px = c * cellSize;
      const py = r * cellSize;
      if (cellSize >= 6) {
        ctx.strokeStyle = 'rgba(31, 35, 40, 0.1)';
        ctx.lineWidth = 0.75;
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
      ctx.fillStyle = track.isWall(r, c)
        ? '#1e293b'
        : trackColor(snapshot.field.distanceFromStart(r, c), baseline);
      ctx.fillRect(px + inset, py + inset, cellSize - inset * 2, cellSize - inset * 2);
    }
  }
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  center: GridPoint,
  radius: number,
  rows: number,
  cols: number,
  cellSize: number,
): void {
  const rMin = Math.max(0, center.row - radius);
  const rMax = Math.min(rows - 1, center.row + radius);
  ctx.fillStyle = 'rgba(9, 105, 218, 0.2)';
  for (let r = rMin; r <= rMax; r += 1) {
    const rem = radius - Math.abs(r - center.row);
    const cMin = Math.max(0, center.col - rem);
    const cMax = Math.min(cols - 1, center.col + rem);
    ctx.fillRect(cMin * cellSize, r * cellSize, (cMax - cMin + 1) * cellSize, cellSize);
  }
}

function drawEndpoint(
  ctx: CanvasRenderingContext2D,
  pt: GridPoint,
  cellSize: number,
  color: string,
  label: string,
): void {
  const inset = cellSize >= 8 ? 1 : 0;
  ctx.fillStyle = color;
  ctx.fillRect(pt.col * cellSize + inset, pt.row * cellSize + inset, cellSize - inset * 2, cellSize - inset * 2);
  if (cellSize >= 10) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.max(8, Math.round(cellSize * 0.5))}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, (pt.col + 0.5) * cellSize, (pt.row + 0.5) * cellSize);
  }
}

function drawActiveCheat(ctx: CanvasRenderingContext2D, snapshot: RaceConditionSnapshot, cellSize: number): void {
  const cheat = snapshot.activeCheat;
  if (!cheat) return;
  const track = snapshot.field.racetrack;
  drawDiamond(ctx, cheat.start, snapshot.config.maxDuration, track.rows, track.cols, cellSize);

  const sx = (cheat.start.col + 0.5) * cellSize;
  const sy = (cheat.start.row + 0.5) * cellSize;
  const ex = (cheat.end.col + 0.5) * cellSize;
  const ey = (cheat.end.row + 0.5) * cellSize;

  ctx.save();
  ctx.shadowColor = 'rgba(217, 119, 6, 0.65)';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = Math.max(2, cellSize * 0.25);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  const radius = Math.max(2.5, cellSize * 0.26);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(ex, ey, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** HiDPI Canvas 2D renderer for Race Condition track, Manhattan diamond, and cheat jump. */
export function RacetrackCanvas({ snapshot }: RacetrackCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const track = snapshot.field.racetrack;
  const cellSize = computeCellSize(track.rows, track.cols);
  const width = track.cols * cellSize;
  const height = track.rows * cellSize;

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
    drawEndpoint(ctx, track.start, cellSize, '#059669', 'S');
    drawEndpoint(ctx, track.end, cellSize, '#e11d48', 'E');
    drawActiveCheat(ctx, snapshot, cellSize);
  }, [snapshot, track, cellSize, width, height]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Racetrack ${track.rows}x${track.cols} (${snapshot.phase}, saving ${snapshot.activeSaving})`}
      style={{
        width: '100%',
        maxWidth: width,
        aspectRatio: `${width} / ${height}`,
        display: 'block',
        border: snapshot.phase === 'complete' && snapshot.activeCheat ? '2px solid var(--gold)' : '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    />
  );
}
