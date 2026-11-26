import { useEffect, useRef } from 'react';
import { DIRS_4 } from '../../../../shared/core';
import { bitToDirIndex, pipePorts, type GridCoord, type PipeShape } from '../index';
import { PALETTE, distanceColor } from './palette';
import type { PipeMazeViewProps } from './PipeMazeSvg';

function strokePipe(
  ctx: CanvasRenderingContext2D,
  shape: PipeShape,
  row: number,
  col: number,
  cell: number,
): void {
  const half = cell / 2;
  const cx = col * cell + half;
  const cy = row * cell + half;
  const [p1, p2] = pipePorts(shape);
  const [dr1, dc1] = DIRS_4[bitToDirIndex(p1)]!;
  const [dr2, dc2] = DIRS_4[bitToDirIndex(p2)]!;
  ctx.beginPath();
  ctx.moveTo(cx + dc1 * half, cy + dr1 * half);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + dc2 * half, cy + dr2 * half);
  ctx.stroke();
}

function drawEnclosedAndScan(
  ctx: CanvasRenderingContext2D,
  props: PipeMazeViewProps,
  cell: number,
  width: number,
): void {
  const { maze, enclosedMask, revealedUpToRow, activeScanRow } = props;
  if (activeScanRow !== undefined) {
    ctx.fillStyle = PALETTE.scanLine;
    ctx.fillRect(0, activeScanRow * cell, width, cell);
  }
  if (!enclosedMask) return;
  ctx.fillStyle = PALETTE.enclosedFill;
  const maxRow = revealedUpToRow === undefined ? maze.rows - 1 : Math.min(maze.rows - 1, revealedUpToRow);
  for (let r = 0; r <= maxRow; r += 1) {
    for (let c = 0; c < maze.cols; c += 1) {
      if (enclosedMask[r * maze.cols + c] === 1) {
        ctx.fillRect(c * cell + 0.5, r * cell + 0.5, Math.max(1, cell - 1), Math.max(1, cell - 1));
      }
    }
  }
}

function drawPipes(ctx: CanvasRenderingContext2D, props: PipeMazeViewProps, cell: number): void {
  const { maze, loop, activeDistance, clutterMode } = props;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let r = 0; r < maze.rows; r += 1) {
    for (let c = 0; c < maze.cols; c += 1) {
      const onLoop = loop.isOnLoop(r, c);
      const tile = maze.effectiveTileAt(r, c);
      if (!onLoop) {
        if (clutterMode === 'dim' && tile !== '.') {
          ctx.strokeStyle = 'rgba(154, 164, 178, 0.35)';
          ctx.lineWidth = Math.max(0.8, cell * 0.16);
          strokePipe(ctx, tile, r, c, cell);
        }
        continue;
      }
      const dist = loop.distanceAt(r, c);
      const discovered = activeDistance === undefined || dist <= activeDistance;
      ctx.strokeStyle = discovered ? distanceColor(dist / loop.farthestDistance) : PALETTE.border;
      ctx.lineWidth = discovered ? Math.max(1.4, cell * 0.34) : Math.max(1, cell * 0.2);
      strokePipe(ctx, tile as PipeShape, r, c, cell);
    }
  }
}

function drawMarker(ctx: CanvasRenderingContext2D, coord: GridCoord | undefined, cell: number, fill: string): void {
  if (!coord) return;
  const cx = (coord.col + 0.5) * cell;
  const cy = (coord.row + 0.5) * cell;
  const r = Math.max(2.6, cell * 0.42);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = Math.max(1, cell * 0.14);
  ctx.strokeStyle = PALETTE.surface;
  ctx.stroke();
}

/** HiDPI `<canvas>` renderer for large grids (> 25x25, including 140x140). */
export function PipeMazeHiDpiCanvas(props: PipeMazeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { maze, loop, activeDistance, frontA, frontB, clutterMode, enclosedMask, revealedUpToRow, activeScanRow } = props;
  const cell = Math.max(4, Math.floor(640 / Math.max(maze.rows, maze.cols)));
  const cssW = maze.cols * cell;
  const cssH = maze.rows * cell;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PALETTE.surface;
    ctx.fillRect(0, 0, cssW, cssH);
    drawEnclosedAndScan(ctx, props, cell, cssW);
    drawPipes(ctx, props, cell);
    drawMarker(ctx, maze.start, cell, PALETTE.accent);
    drawMarker(ctx, frontA, cell, PALETTE.gold);
    drawMarker(ctx, frontB, cell, PALETTE.gold);
  }, [maze, loop, activeDistance, frontA, frontB, clutterMode, enclosedMask, revealedUpToRow, activeScanRow, cell, cssW, cssH]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Pipe maze HiDPI canvas"
      style={{ width: '100%', maxWidth: `${cssW}px`, height: 'auto', display: 'block', margin: '0 auto' }}
    />
  );
}
