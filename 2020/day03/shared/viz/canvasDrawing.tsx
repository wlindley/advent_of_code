import type { ForestMap, Slope, TrajectoryTraceFrame } from '../index';
import { resolveVizColors, slopeAccentColor, type VizColors } from './palette';

export interface CanvasPanelRect { readonly x: number; readonly y: number; readonly w: number; readonly h: number; }

export interface CanvasDrawContext {
  readonly ctx: CanvasRenderingContext2D;
  readonly forest: ForestMap;
  readonly frame: TrajectoryTraceFrame;
  readonly focusedIndex: number;
  readonly colors: VizColors;
}

interface CorridorGeom { readonly startRow: number; readonly startCol: number; readonly cellW: number; readonly cellH: number; readonly ox: number; readonly oy: number; }

function drawPanelBox(ctx: CanvasRenderingContext2D, rect: CanvasPanelRect, title: string, colors: VizColors): void {
  ctx.fillStyle = colors.surface;
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = colors.text;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText(title, rect.x + 10, rect.y + 18);
}

function visibleStart(current: number, total: number, windowSize: number): number {
  const half = Math.floor(windowSize / 2);
  return Math.max(0, Math.min(current - half, Math.max(0, total - windowSize)));
}

function drawTileCell(dc: CanvasDrawContext, x: number, y: number, size: number, isTree: boolean, isCurrentRow: boolean, isLanding: boolean): void {
  dc.ctx.fillStyle = isCurrentRow ? dc.colors.bg : dc.colors.surface;
  dc.ctx.fillRect(x + 0.5, y + 0.5, size - 1, size - 1);
  const cx = x + size / 2;
  const cy = y + size / 2;
  dc.ctx.beginPath();
  if (isTree) {
    dc.ctx.fillStyle = dc.colors.ok;
    dc.ctx.moveTo(cx, cy - size * 0.34);
    dc.ctx.lineTo(cx + size * 0.3, cy + size * 0.28);
    dc.ctx.lineTo(cx - size * 0.3, cy + size * 0.28);
    dc.ctx.closePath();
  } else {
    dc.ctx.fillStyle = dc.colors.border;
    dc.ctx.arc(cx, cy, Math.max(1.2, size * 0.09), 0, Math.PI * 2);
  }
  dc.ctx.fill();
  if (isLanding) {
    dc.ctx.strokeStyle = isTree ? dc.colors.err : dc.colors.accent;
    dc.ctx.lineWidth = isCurrentRow ? 2.5 : 1.5;
    dc.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }
}

export function drawWrappedTilePanel(dc: CanvasDrawContext, rect: CanvasPanelRect): void {
  drawPanelBox(dc.ctx, rect, `Base Tile (mod ${dc.forest.cols})`, dc.colors);
  const progress = dc.frame.slopes[dc.focusedIndex] ?? dc.frame.slopes[0]!;
  const slope = progress.slope;
  const maxRows = Math.min(dc.forest.rows, 13);
  const maxCols = Math.min(dc.forest.cols, 16);
  const startRow = visibleStart(dc.frame.row, dc.forest.rows, maxRows);
  const startCol = visibleStart(progress.activeLanding?.wrappedCol ?? 0, dc.forest.cols, maxCols);
  const size = Math.min((rect.w - 24) / maxCols, (rect.h - 42) / maxRows);
  const ox = rect.x + (rect.w - maxCols * size) / 2;
  const oy = rect.y + 30;
  for (let r = 0; r < maxRows; r += 1) {
    const row = startRow + r;
    const landCol = row > 0 && row % slope.down === 0 ? dc.forest.wrapCol((row / slope.down) * slope.right) : -1;
    for (let c = 0; c < maxCols; c += 1) {
      const col = startCol + c;
      drawTileCell(dc, ox + c * size, oy + r * size, size, dc.forest.hasTreeAt(row, col), row === dc.frame.row, row <= dc.frame.row && col === landCol);
    }
  }
}

function drawCorridorStep(dc: CanvasDrawContext, slope: Slope, step: number, geom: CorridorGeom): void {
  const row = step * slope.down;
  const col = step * slope.right;
  const cx = geom.ox + (col - geom.startCol + 0.5) * geom.cellW;
  const cy = geom.oy + (row - geom.startRow) * geom.cellH;
  const isTree = step > 0 && dc.forest.hasTreeAt(row, col);
  dc.ctx.fillStyle = step === 0 ? dc.colors.muted : isTree ? dc.colors.err : dc.colors.accent;
  dc.ctx.beginPath();
  dc.ctx.arc(cx, cy, step === 0 ? 3 : 4, 0, Math.PI * 2);
  dc.ctx.fill();
}

export function drawUnwrappedCorridorPanel(dc: CanvasDrawContext, rect: CanvasPanelRect): void {
  const progress = dc.frame.slopes[dc.focusedIndex] ?? dc.frame.slopes[0]!;
  const slope = progress.slope;
  drawPanelBox(dc.ctx, rect, `Unwrapped Corridor (${slope.label})`, dc.colors);
  const startRow = visibleStart(dc.frame.row, dc.forest.rows, 13);
  const visibleRows = Math.min(dc.forest.rows - 1, startRow + 12) - startRow + 1;
  const focusCol = progress.activeLanding?.col ?? Math.floor(dc.frame.row / slope.down) * slope.right;
  const spanCols = Math.max(dc.forest.cols * 2, slope.right * 8, 12);
  const startCol = Math.max(0, focusCol - Math.floor(spanCols * 0.65));
  const geom: CorridorGeom = { startRow, startCol, cellW: (rect.w - 24) / spanCols, cellH: (rect.h - 44) / Math.max(1, visibleRows), ox: rect.x + 12, oy: rect.y + 32 };
  dc.ctx.strokeStyle = dc.colors.gold;
  dc.ctx.setLineDash([3, 3]);
  for (let seam = Math.ceil(startCol / dc.forest.cols) * dc.forest.cols; seam <= startCol + spanCols; seam += dc.forest.cols) {
    const sx = geom.ox + (seam - startCol) * geom.cellW;
    dc.ctx.beginPath();
    dc.ctx.moveTo(sx, geom.oy - 4);
    dc.ctx.lineTo(sx, geom.oy + visibleRows * geom.cellH);
    dc.ctx.stroke();
  }
  dc.ctx.setLineDash([]);
  for (let step = Math.ceil(startRow / slope.down); step <= Math.floor(dc.frame.row / slope.down); step += 1) {
    drawCorridorStep(dc, slope, step, geom);
  }
}

export function drawForestMinimap(dc: CanvasDrawContext, rect: CanvasPanelRect): void {
  drawPanelBox(dc.ctx, rect, 'Depth', dc.colors);
  const innerY = rect.y + 30;
  const innerH = rect.h - 42;
  const denom = Math.max(1, dc.forest.rows - 1);
  const barY = innerY + (dc.frame.row / denom) * innerH;
  dc.ctx.fillStyle = dc.colors.bg;
  dc.ctx.fillRect(rect.x + 12, innerY, rect.w - 24, innerH);
  const stepSkip = Math.max(1, Math.floor(dc.forest.rows / 80));
  for (let sIdx = 0; sIdx < dc.frame.slopes.length; sIdx += 1) {
    const slope = dc.frame.slopes[sIdx]!.slope;
    const laneX = rect.x + 18 + ((rect.w - 36) * (sIdx + 0.5)) / dc.frame.slopes.length;
    dc.ctx.fillStyle = slopeAccentColor(sIdx, dc.colors);
    for (let r = slope.down; r <= dc.frame.row; r += slope.down * stepSkip) {
      const isTree = dc.forest.hasTreeAt(r, (r / slope.down) * slope.right);
      dc.ctx.fillRect(laneX - 2, innerY + (r / denom) * innerH - 1, 4, isTree ? 3 : 1.5);
    }
  }
  dc.ctx.strokeStyle = dc.colors.err;
  dc.ctx.lineWidth = 2;
  dc.ctx.beginPath();
  dc.ctx.moveTo(rect.x + 10, barY);
  dc.ctx.lineTo(rect.x + rect.w - 10, barY);
  dc.ctx.stroke();
}

/** Renders the 3-panel forest trajectory canvas for the active trace frame. */
export function renderTrajectoryCanvas(canvas: HTMLCanvasElement, forest: ForestMap, frame: TrajectoryTraceFrame, focusedIndex: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const colors = resolveVizColors(canvas);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(720 * dpr);
  canvas.height = Math.round(340 * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, 720, 340);
  const dc: CanvasDrawContext = { ctx, forest, frame, focusedIndex, colors };
  drawWrappedTilePanel(dc, { x: 10, y: 10, w: 324, h: 320 });
  drawUnwrappedCorridorPanel(dc, { x: 344, y: 10, w: 264, h: 320 });
  drawForestMinimap(dc, { x: 618, y: 10, w: 92, h: 320 });
}
