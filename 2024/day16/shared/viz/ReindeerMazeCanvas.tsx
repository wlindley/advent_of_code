import { useEffect, useRef } from 'react';
import { DIR_DELTAS, type MazeAnalysis, type MazeTraceFrame, type PathStep } from '../index';

export interface ReindeerMazeCanvasProps {
  readonly frame: MazeTraceFrame;
  readonly showAllOptimalTiles: boolean;
}

function computeCellSize(width: number, height: number): number {
  return Math.max(3, Math.min(28, Math.floor(560 / Math.max(width, height))));
}

function waveColor(ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio));
  const hue = Math.round(195 + t * 55);
  const light = Math.round(86 - t * 28);
  return `hsl(${hue} 78% ${light}%)`;
}

function drawMazeBase(ctx: CanvasRenderingContext2D, analysis: MazeAnalysis, size: number): void {
  const { maze } = analysis;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, maze.width * size, maze.height * size);
  ctx.fillStyle = '#1e293b';
  for (let r = 0; r < maze.height; r += 1) {
    for (let c = 0; c < maze.width; c += 1) {
      if (maze.isWall(r, c)) ctx.fillRect(c * size, r * size, size, size);
    }
  }
}

function drawSettledWave(ctx: CanvasRenderingContext2D, frame: MazeTraceFrame, size: number): void {
  const { analysis, maxSettledDist } = frame.context;
  const { maze } = analysis;
  for (let i = 0; i < frame.settledCount; i += 1) {
    const cell = analysis.settledCellAt(i);
    ctx.fillStyle = waveColor(analysis.minCellDistAt(cell) / maxSettledDist);
    ctx.fillRect(maze.colOf(cell) * size, maze.rowOf(cell) * size, size, size);
  }
}

function drawOptimalTiles(ctx: CanvasRenderingContext2D, analysis: MazeAnalysis, size: number): void {
  const { maze } = analysis;
  ctx.fillStyle = 'rgba(245, 158, 11, 0.55)';
  for (let cell = 0; cell < maze.cellCount; cell += 1) {
    if (!analysis.isOptimalCell(cell)) continue;
    ctx.fillRect(maze.colOf(cell) * size, maze.rowOf(cell) * size, size, size);
  }
}

function drawPathHead(ctx: CanvasRenderingContext2D, head: PathStep, size: number): void {
  const hx = (head.col + 0.5) * size;
  const hy = (head.row + 0.5) * size;
  const [dr, dc] = DIR_DELTAS[head.dir];
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(hx, hy, Math.max(2, size * 0.3), 0, Math.PI * 2);
  ctx.fill();
  if (size >= 8) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.2, size * 0.1);
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + dc * size * 0.28, hy + dr * size * 0.28);
    ctx.stroke();
  }
}

function drawCanonicalPath(
  ctx: CanvasRenderingContext2D,
  path: readonly PathStep[],
  shown: number,
  size: number,
): void {
  if (shown <= 0) return;
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = Math.max(1.5, size * 0.28);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < shown; i += 1) {
    const step = path[i]!;
    const x = (step.col + 0.5) * size;
    const y = (step.row + 0.5) * size;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  drawPathHead(ctx, path[shown - 1]!, size);
}

function drawTerminalMarker(
  ctx: CanvasRenderingContext2D, analysis: MazeAnalysis, cell: number, size: number, fill: string, label: string,
): void {
  const pad = size >= 8 ? 1.5 : 0;
  const x = analysis.maze.colOf(cell) * size;
  const y = analysis.maze.rowOf(cell) * size;
  ctx.fillStyle = fill;
  ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
  if (size >= 11) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.floor(size * 0.56)}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + size * 0.5, y + size * 0.54);
  }
}

/** HiDPI Canvas 2D renderer for Dijkstra wave exploration, path reconstruction, and optimal seats. */
export function ReindeerMazeCanvas({ frame, showAllOptimalTiles }: ReindeerMazeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { analysis, canonicalPath } = frame.context;
  const { maze } = analysis;
  const cellSize = computeCellSize(maze.width, maze.height);
  const width = maze.width * cellSize;
  const height = maze.height * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMazeBase(ctx, analysis, cellSize);
    drawSettledWave(ctx, frame, cellSize);
    if (showAllOptimalTiles && frame.showOptimalMask) drawOptimalTiles(ctx, analysis, cellSize);
    drawCanonicalPath(ctx, canonicalPath, frame.pathStepsShown, cellSize);
    drawTerminalMarker(ctx, analysis, maze.startCell, cellSize, '#059669', 'S');
    drawTerminalMarker(ctx, analysis, maze.endCell, cellSize, '#e11d48', 'E');
  }, [frame, analysis, canonicalPath, showAllOptimalTiles, cellSize, width, height, maze]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Reindeer maze ${maze.width}x${maze.height}, phase ${frame.phase}, frontier cost ${frame.frontierCost}`}
      style={{
        width: '100%',
        maxWidth: width,
        aspectRatio: `${width} / ${height}`,
        display: 'block',
        border: frame.phase === 'complete' ? '2px solid var(--gold)' : '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    />
  );
}
