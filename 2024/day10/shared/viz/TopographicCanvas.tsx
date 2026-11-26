import { useEffect, useRef } from 'react';
import {
  IMPASSABLE_HEIGHT,
  type PeakContributionMode,
  type TopographicMap,
  type TrailheadTraceFrame,
} from '../index';
import { elevationColor, TRAIL_OVERLAY_COLORS } from './palette';

export interface TopographicCanvasProps {
  readonly map: TopographicMap;
  readonly frame: TrailheadTraceFrame | null;
  readonly mode: PeakContributionMode;
}

function computeCellSize(map: TopographicMap): number {
  const maxDim = Math.max(map.rows, map.cols);
  return Math.max(4, Math.min(44, Math.floor(640 / maxDim)));
}

function drawElevationCells(
  ctx: CanvasRenderingContext2D,
  map: TopographicMap,
  cellSize: number,
): void {
  const showLabels = map.rows <= 16 && map.cols <= 16 && cellSize >= 18;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.max(10, Math.round(cellSize * 0.44))}px ui-monospace, monospace`;

  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      const h = map.heightAt(r, c);
      const x = c * cellSize;
      const y = r * cellSize;
      ctx.fillStyle = elevationColor(h);
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.14)';
      ctx.lineWidth = 0.75;
      ctx.strokeRect(x, y, cellSize, cellSize);
      if (showLabels) {
        ctx.fillStyle = h === IMPASSABLE_HEIGHT ? '#59636e' : TRAIL_OVERLAY_COLORS.labelInk;
        ctx.fillText(h === IMPASSABLE_HEIGHT ? '·' : String(h), x + cellSize / 2, y + cellSize / 2);
      }
    }
  }
}

function drawPeakBeacon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  pathCount: number,
  mode: PeakContributionMode,
): void {
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;
  if (mode === 'rating' && cellSize >= 18) {
    const pad = Math.max(2, cellSize * 0.12);
    ctx.fillStyle = TRAIL_OVERLAY_COLORS.peakFill;
    ctx.strokeStyle = TRAIL_OVERLAY_COLORS.badgeBg;
    ctx.lineWidth = 1.5;
    ctx.fillRect(x + pad, y + pad, cellSize - 2 * pad, cellSize - 2 * pad);
    ctx.strokeRect(x + pad, y + pad, cellSize - 2 * pad, cellSize - 2 * pad);
    ctx.fillStyle = TRAIL_OVERLAY_COLORS.badgeBg;
    ctx.font = `700 ${Math.max(9, Math.round(cellSize * 0.36))}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(pathCount), cx, cy);
    return;
  }
  const radius = Math.max(2.5, cellSize * 0.24);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = TRAIL_OVERLAY_COLORS.peakFill;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = TRAIL_OVERLAY_COLORS.badgeBg;
  ctx.stroke();
}

function drawFrameOverlay(
  ctx: CanvasRenderingContext2D,
  map: TopographicMap,
  frame: TrailheadTraceFrame,
  mode: PeakContributionMode,
  cellSize: number,
): void {
  for (const idx of frame.reachableIndices) {
    const [r, c] = map.coordsOf(idx);
    ctx.fillStyle = TRAIL_OVERLAY_COLORS.reachableFill;
    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    ctx.strokeStyle = TRAIL_OVERLAY_COLORS.reachableStroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(c * cellSize + 0.5, r * cellSize + 0.5, cellSize - 1, cellSize - 1);
  }

  for (const peak of frame.peaks) {
    const [pr, pc] = map.coordsOf(peak.index);
    drawPeakBeacon(ctx, pc * cellSize, pr * cellSize, cellSize, peak.pathCount, mode);
  }

  const [tr, tc] = map.coordsOf(frame.trailheadIndex);
  ctx.beginPath();
  ctx.arc(
    tc * cellSize + cellSize / 2,
    tr * cellSize + cellSize / 2,
    Math.max(3, cellSize * 0.36),
    0,
    Math.PI * 2,
  );
  ctx.strokeStyle = TRAIL_OVERLAY_COLORS.trailhead;
  ctx.lineWidth = Math.max(2, cellSize * 0.12);
  ctx.stroke();
}

/** HiDPI topographic elevation canvas with active trailhead basin and summit overlays. */
export function TopographicCanvas({ map, frame, mode }: TopographicCanvasProps) {
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
    drawElevationCells(ctx, map, cellSize);
    if (frame) {
      drawFrameOverlay(ctx, map, frame, mode, cellSize);
    }
  }, [map, frame, mode, cellSize, width, height]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Topographic map ${map.rows}x${map.cols}`}
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
