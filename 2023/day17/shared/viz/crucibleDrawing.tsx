import type { CrucibleSearchResult, CrucibleTraceFrame, HeatMap } from '../index';

export const CANVAS_RIM = 14;

export interface ThemeColors {
  readonly surface: string;
  readonly border: string;
  readonly text: string;
  readonly accent: string;
  readonly ok: string;
  readonly gold: string;
  readonly warn: string;
}

/** Reads light-mode CSS variables from the host canvas element. */
export function readThemeColors(el: HTMLElement): ThemeColors {
  const s = getComputedStyle(el);
  const v = (k: string, d: string) => s.getPropertyValue(k).trim() || d;
  return {
    surface: v('--surface', '#ffffff'), border: v('--border', '#d0d7de'), text: v('--text', '#1f2328'),
    accent: v('--accent', '#0969da'), ok: v('--ok', '#1a7f37'), gold: v('--gold', '#9a6700'), warn: v('--warn', '#bc4c00'),
  };
}

function cellCenter(cellIndex: number, width: number, cell: number): readonly [number, number] {
  const r = Math.floor(cellIndex / width);
  const c = cellIndex % width;
  return [CANVAS_RIM + (c + 0.5) * cell, CANVAS_RIM + (r + 0.5) * cell];
}

function cellBackground(digit: number, isSettled: boolean, isFrontier: boolean): string {
  if (isFrontier) return `hsl(${38 - digit * 2.5}, 92%, ${76 - digit * 2.2}%)`;
  if (isSettled) return `hsl(${32 - digit * 3}, 78%, ${88 - digit * 3.1}%)`;
  return `hsl(210, 14%, ${97 - digit * 1.4}%)`;
}

function drawGridCell(
  ctx: CanvasRenderingContext2D, digit: number, settledHeat: number,
  x: number, y: number, cell: number, heatThreshold: number, prevThreshold: number, theme: ThemeColors,
): void {
  const isSettled = settledHeat >= 0 && settledHeat <= heatThreshold;
  const isFrontier = isSettled && settledHeat > prevThreshold;
  ctx.fillStyle = cellBackground(digit, isSettled, isFrontier);
  ctx.fillRect(x, y, cell, cell);
  if (isFrontier) {
    ctx.strokeStyle = theme.gold;
    ctx.lineWidth = Math.max(1, cell * 0.08);
    ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
  }
  if (cell >= 13) {
    ctx.fillStyle = isSettled ? theme.text : 'rgba(31, 35, 40, 0.52)';
    ctx.font = `${Math.round(cell * 0.48)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(digit), x + cell * 0.5, y + cell * 0.53);
  }
}

function drawOptimalRoute(
  ctx: CanvasRenderingContext2D, result: CrucibleSearchResult, cell: number, theme: ThemeColors,
): void {
  const turns = result.turnCells;
  if (turns.length < 2) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [color, width] of [[theme.surface, Math.max(3.6, cell * 0.34)], [theme.accent, Math.max(2, cell * 0.18)]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    const [sx, sy] = cellCenter(turns[0]!, result.width, cell);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < turns.length; i += 1) {
      const [px, py] = cellCenter(turns[i]!, result.width, cell);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  const r = Math.max(2, Math.min(4.8, cell * 0.2));
  for (let i = 1; i < turns.length - 1; i += 1) {
    const [vx, vy] = cellCenter(turns[i]!, result.width, cell);
    ctx.fillStyle = theme.gold;
    ctx.strokeStyle = theme.surface;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(vx, vy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawPin(
  ctx: CanvasRenderingContext2D, label: string, cellIndex: number,
  width: number, cell: number, fill: string, theme: ThemeColors,
): void {
  const [cx, cy] = cellCenter(cellIndex, width, cell);
  const r = Math.max(3.2, Math.min(9, cell * 0.36));
  ctx.fillStyle = fill;
  ctx.strokeStyle = theme.surface;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (cell >= 14) {
    ctx.fillStyle = theme.surface;
    ctx.font = `700 ${Math.round(r * 1.1)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + 0.5);
  }
}

/** Draws the magma thermal grid, iso-heat wavefront, active frontier ring, and final optimal route. */
export function drawCrucibleScene(
  ctx: CanvasRenderingContext2D, map: HeatMap, frame: CrucibleTraceFrame,
  prevThreshold: number, cell: number, theme: ThemeColors,
): void {
  const gridW = map.width * cell;
  const gridH = map.height * cell;
  ctx.fillStyle = theme.surface;
  ctx.fillRect(0, 0, gridW + CANVAS_RIM * 2, gridH + CANVAS_RIM * 2);
  for (let r = 0; r < map.height; r += 1) {
    for (let c = 0; c < map.width; c += 1) {
      drawGridCell(
        ctx, map.heatAt(r, c), frame.result.settledHeatAt(r, c),
        CANVAS_RIM + c * cell, CANVAS_RIM + r * cell, cell, frame.heatThreshold, prevThreshold, theme,
      );
    }
  }
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(CANVAS_RIM + 0.5, CANVAS_RIM + 0.5, gridW - 1, gridH - 1);
  if (frame.isComplete) drawOptimalRoute(ctx, frame.result, cell, theme);
  drawPin(ctx, 'S', 0, map.width, cell, theme.ok, theme);
  drawPin(ctx, 'G', map.goalCell, map.width, cell, theme.warn, theme);
}
