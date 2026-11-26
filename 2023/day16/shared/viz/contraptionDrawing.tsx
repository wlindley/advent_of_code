import {
  BEAM_DIRECTIONS, type BeamDirection, type BeamState, type BeamWaveFrame, type Contraption,
  DIR_DC, DIR_DR, type EdgeBeamScore, MASK_TO_DIR, outgoingMask,
  TILE_BACKSLASH, TILE_EMPTY, TILE_SLASH, TILE_SPLIT_H, TILE_SPLIT_V, type TileCode,
} from '../index';

export const CANVAS_RIM = 14;

export interface ThemeColors {
  readonly surface: string;
  readonly border: string;
  readonly text: string;
  readonly accent: string;
  readonly ok: string;
  readonly warn: string;
}

/** Reads light-mode CSS variables from the host canvas element. */
export function readThemeColors(el: HTMLElement): ThemeColors {
  const s = getComputedStyle(el);
  const v = (k: string, d: string) => s.getPropertyValue(k).trim() || d;
  return {
    surface: v('--surface', '#ffffff'), border: v('--border', '#d0d7de'),
    text: v('--text', '#1f2328'), accent: v('--accent', '#0969da'),
    ok: v('--ok', '#1a7f37'), warn: v('--warn', '#bc4c00'),
  };
}

function edgeCoords(x: number, y: number, cell: number, side: BeamDirection): readonly [number, number] {
  return [x + cell * (0.5 + 0.5 * DIR_DC[side]!), y + cell * (0.5 + 0.5 * DIR_DR[side]!)];
}

function drawCellRays(
  ctx: CanvasRenderingContext2D, tileCode: TileCode, mask: number,
  x: number, y: number, cell: number, theme: ThemeColors,
): void {
  const cx = x + cell * 0.5;
  const cy = y + cell * 0.5;
  ctx.strokeStyle = theme.warn;
  ctx.lineWidth = Math.max(1.2, cell * 0.14);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const dir of BEAM_DIRECTIONS) {
    if ((mask & (1 << dir)) === 0) continue;
    const [ix, iy] = edgeCoords(x, y, cell, ((dir + 2) & 3) as BeamDirection);
    ctx.moveTo(ix, iy);
    ctx.lineTo(cx, cy);
    for (let outMask = outgoingMask(tileCode, dir); outMask !== 0;) {
      const bit = outMask & -outMask;
      outMask ^= bit;
      const [ox, oy] = edgeCoords(x, y, cell, MASK_TO_DIR[bit]! as BeamDirection);
      ctx.moveTo(cx, cy);
      ctx.lineTo(ox, oy);
    }
  }
  ctx.stroke();
}

function drawTileGlyph(
  ctx: CanvasRenderingContext2D, tileCode: TileCode, x: number, y: number, cell: number, theme: ThemeColors,
): void {
  if (tileCode === TILE_EMPTY) {
    if (cell >= 12) {
      ctx.fillStyle = 'rgba(89, 99, 110, 0.28)';
      ctx.fillRect(x + cell * 0.5 - 0.75, y + cell * 0.5 - 0.75, 1.5, 1.5);
    }
    return;
  }
  const pad = Math.max(1.2, cell * 0.18);
  const cx = x + cell * 0.5;
  const cy = y + cell * 0.5;
  ctx.strokeStyle = theme.text;
  ctx.lineWidth = Math.max(1.25, cell * 0.13);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (tileCode === TILE_SLASH) { ctx.moveTo(x + pad, y + cell - pad); ctx.lineTo(x + cell - pad, y + pad); }
  else if (tileCode === TILE_BACKSLASH) { ctx.moveTo(x + pad, y + pad); ctx.lineTo(x + cell - pad, y + cell - pad); }
  else if (tileCode === TILE_SPLIT_V) { ctx.moveTo(cx, y + pad); ctx.lineTo(cx, y + cell - pad); }
  else if (tileCode === TILE_SPLIT_H) { ctx.moveTo(x + pad, cy); ctx.lineTo(x + cell - pad, cy); }
  ctx.stroke();
}

function drawEntryArrow(ctx: CanvasRenderingContext2D, entry: BeamState, cell: number, color: string): void {
  const cx = CANVAS_RIM + (entry.col + 0.5) * cell;
  const cy = CANVAS_RIM + (entry.row + 0.5) * cell;
  const dx = DIR_DC[entry.dir]!;
  const dy = DIR_DR[entry.dir]!;
  const tipX = cx - dx * (cell * 0.5 + 1.5);
  const tipY = cy - dy * (cell * 0.5 + 1.5);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - dx * (cell * 0.5 + 11), cy - dy * (cell * 0.5 + 11));
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - dx * 4.5 - dy * 3.2, tipY - dy * 4.5 + dx * 3.2);
  ctx.lineTo(tipX - dx * 4.5 + dy * 3.2, tipY - dy * 4.5 - dx * 3.2);
  ctx.closePath();
  ctx.fill();
}

function drawEdgeHeatmap(
  ctx: CanvasRenderingContext2D, edgeScores: readonly EdgeBeamScore[], cell: number,
  optimalEntry: BeamState | undefined, theme: ThemeColors,
): void {
  let maxScore = 1;
  for (const item of edgeScores) if (item.energizedCount > maxScore) maxScore = item.energizedCount;
  const r = Math.max(1.5, Math.min(4.2, cell * 0.22));
  for (const { entry, energizedCount } of edgeScores) {
    const isBest = optimalEntry && entry.row === optimalEntry.row && entry.col === optimalEntry.col && entry.dir === optimalEntry.dir;
    const cx = CANVAS_RIM + (entry.col + 0.5) * cell - DIR_DC[entry.dir]! * (cell * 0.5 + 6);
    const cy = CANVAS_RIM + (entry.row + 0.5) * cell - DIR_DR[entry.dir]! * (cell * 0.5 + 6);
    ctx.fillStyle = isBest ? theme.ok : `rgba(154, 103, 0, ${(0.22 + 0.78 * (energizedCount / maxScore)).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFrontierDots(ctx: CanvasRenderingContext2D, frame: BeamWaveFrame, cell: number, theme: ThemeColors): void {
  const radius = Math.max(2, Math.min(5.5, cell * 0.24));
  for (const beam of frame.frontier) {
    ctx.beginPath();
    ctx.arc(CANVAS_RIM + (beam.col + 0.5) * cell, CANVAS_RIM + (beam.row + 0.5) * cell, radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.accent;
    ctx.fill();
    ctx.strokeStyle = theme.surface;
    ctx.lineWidth = Math.max(1, radius * 0.35);
    ctx.stroke();
  }
}

/** Draws the full contraption grid, lava glow, directional rays, frontier, and rim cues. */
export function drawContraptionScene(
  ctx: CanvasRenderingContext2D, contraption: Contraption, frame: BeamWaveFrame, cell: number,
  theme: ThemeColors, edgeScores?: readonly EdgeBeamScore[], optimalEntry?: BeamState,
): void {
  const gridW = contraption.width * cell;
  const gridH = contraption.height * cell;
  ctx.fillStyle = theme.surface;
  ctx.fillRect(0, 0, gridW + CANVAS_RIM * 2, gridH + CANVAS_RIM * 2);
  for (let r = 0; r < contraption.height; r += 1) {
    for (let c = 0; c < contraption.width; c += 1) {
      const x = CANVAS_RIM + c * cell;
      const y = CANVAS_RIM + r * cell;
      const mask = frame.maskAt(r, c);
      const tileCode = contraption.tileCodeAt(r, c);
      if (mask !== 0) {
        ctx.fillStyle = 'rgba(188, 76, 0, 0.14)';
        ctx.fillRect(x, y, cell, cell);
        drawCellRays(ctx, tileCode, mask, x, y, cell, theme);
      }
      drawTileGlyph(ctx, tileCode, x, y, cell, theme);
    }
  }
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(CANVAS_RIM + 0.5, CANVAS_RIM + 0.5, gridW - 1, gridH - 1);
  if (edgeScores) drawEdgeHeatmap(ctx, edgeScores, cell, optimalEntry, theme);
  drawEntryArrow(ctx, frame.entry, cell, theme.accent);
  drawFrontierDots(ctx, frame, cell, theme);
}
