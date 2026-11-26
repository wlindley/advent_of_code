import { useEffect, useRef } from 'react';
import { DIRS_4 } from '../../../../shared/core';
import type { GardenMap, GardenRegion, GardenTraceFrame, RegionPartition } from '../index';

export interface GardenCanvasProps {
  readonly map: GardenMap;
  readonly partition: RegionPartition;
  readonly frame: GardenTraceFrame | null;
}

const FENCE_GOLD = '#b07200';
const ACTIVE_INK = '#1f2328';
const DIM_INK = '#59636e';

function plantPaletteColor(plant: string, state: 'unvisited' | 'visited' | 'active'): string {
  const index = plant.charCodeAt(0) - 65;
  const hue = Math.round((index * 137.508) % 360);
  if (state === 'active') return `hsl(${hue} 78% 72%)`;
  if (state === 'visited') return `hsl(${hue} 62% 84%)`;
  return `hsl(${hue} 18% 93%)`;
}

function computeCellSize(map: GardenMap): number {
  const maxDim = Math.max(map.rows, map.cols);
  return Math.max(3, Math.min(44, Math.floor(640 / maxDim)));
}

function drawCells(
  ctx: CanvasRenderingContext2D,
  map: GardenMap,
  partition: RegionPartition,
  activeOrder: number,
  cellSize: number,
): void {
  const showLabels = map.rows <= 25 && map.cols <= 25 && cellSize >= 14;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.max(9, Math.round(cellSize * 0.48))}px ui-monospace, monospace`;

  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      const regionId = partition.regionIdAt(r, c);
      const state =
        regionId === activeOrder ? 'active' : regionId < activeOrder ? 'visited' : 'unvisited';
      const x = c * cellSize;
      const y = r * cellSize;
      ctx.fillStyle = plantPaletteColor(map.plantAt(r, c), state);
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.14)';
      ctx.lineWidth = 0.75;
      ctx.strokeRect(x, y, cellSize, cellSize);
      if (showLabels) {
        ctx.fillStyle = state === 'unvisited' ? DIM_INK : ACTIVE_INK;
        ctx.fillText(map.plantAt(r, c), x + cellSize / 2, y + cellSize / 2);
      }
    }
  }
}

function strokeExposedEdge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  dr: number,
  dc: number,
  pad: number,
): void {
  ctx.beginPath();
  if (dr === -1) {
    ctx.moveTo(x, y + pad);
    ctx.lineTo(x + cellSize, y + pad);
  } else if (dc === 1) {
    ctx.moveTo(x + cellSize - pad, y);
    ctx.lineTo(x + cellSize - pad, y + cellSize);
  } else if (dr === 1) {
    ctx.moveTo(x, y + cellSize - pad);
    ctx.lineTo(x + cellSize, y + cellSize - pad);
  } else {
    ctx.moveTo(x + pad, y);
    ctx.lineTo(x + pad, y + cellSize);
  }
  ctx.stroke();
}

function drawActiveFences(
  ctx: CanvasRenderingContext2D,
  map: GardenMap,
  partition: RegionPartition,
  region: GardenRegion,
  cellSize: number,
): void {
  const lineWidth = Math.max(2, Math.min(4, cellSize * 0.16));
  const pad = lineWidth / 2;
  ctx.strokeStyle = FENCE_GOLD;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'square';

  for (const cell of region.cells) {
    const r = map.rowOf(cell);
    const c = map.colOf(cell);
    const x = c * cellSize;
    const y = r * cellSize;
    for (const [dr, dc] of DIRS_4) {
      if (!partition.sameRegion(region.id, r + dr, c + dc)) {
        strokeExposedEdge(ctx, x, y, cellSize, dr, dc, pad);
      }
    }
  }
}

/** HiDPI garden grid canvas highlighting visited regions and active fence boundaries. */
export function GardenCanvas({ map, partition, frame }: GardenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellSize = computeCellSize(map);
  const width = map.cols * cellSize;
  const height = map.rows * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const activeOrder = frame ? frame.regionOrder : -1;
    drawCells(ctx, map, partition, activeOrder, cellSize);
    if (frame) {
      const activeRegion = partition.regions[frame.regionOrder];
      if (activeRegion) {
        drawActiveFences(ctx, map, partition, activeRegion, cellSize);
      }
    }
  }, [map, partition, frame, cellSize, width, height]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Garden plot map ${map.rows}x${map.cols}`}
      style={{
        width: '100%',
        maxWidth: width,
        aspectRatio: `${width} / ${height}`,
        display: 'block',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    />
  );
}
