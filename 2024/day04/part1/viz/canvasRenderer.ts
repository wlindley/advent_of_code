import type { WordSearchGrid } from '../../shared';
import type { WordMatch } from '../domain';

const NS = ['N', '', 'S'] as const;
const EW = ['W', '', 'E'] as const;

export function formatDirection(dr: number, dc: number): string {
  return `${NS[dr + 1] ?? ''}${EW[dc + 1] ?? ''}`;
}

function buildCounts(grid: WordSearchGrid, discovered: readonly WordMatch[]): Uint16Array {
  const counts = new Uint16Array(grid.size);
  for (const m of discovered) {
    for (let i = 0; i < m.length; i += 1) counts[(m.row + i * m.dr) * grid.cols + (m.col + i * m.dc)]! += 1;
  }
  return counts;
}

function buildActiveKeys(cols: number, active: WordMatch | null): Set<number> {
  const keys = new Set<number>();
  if (!active) return keys;
  for (let i = 0; i < active.length; i += 1) {
    keys.add((active.row + i * active.dr) * cols + (active.col + i * active.dc));
  }
  return keys;
}

function drawRay(
  ctx: CanvasRenderingContext2D, m: WordMatch, cs: number, color: string, width: number, markers: boolean,
): void {
  const half = cs / 2;
  const [x0, y0, x1, y1] = [m.col * cs + half, m.row * cs + half, m.endCol * cs + half, m.endRow * cs + half];
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  if (!markers) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x0, y0, Math.max(2, cs * 0.16), 0, Math.PI * 2);
  ctx.fill();
  const a = Math.atan2(y1 - y0, x1 - x0), tip = Math.max(4, cs * 0.26);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - tip * Math.cos(a - 0.55), y1 - tip * Math.sin(a - 0.55));
  ctx.lineTo(x1 - tip * Math.cos(a + 0.55), y1 - tip * Math.sin(a + 0.55));
  ctx.closePath();
  ctx.fill();
}

function drawCells(
  ctx: CanvasRenderingContext2D, grid: WordSearchGrid, counts: Uint16Array, active: Set<number>, cs: number,
): void {
  if (cs >= 14) {
    ctx.font = `700 ${Math.floor(cs * 0.54)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  }
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const idx = r * grid.cols + c, hits = counts[idx]!, isActive = active.has(idx), x = c * cs, y = r * cs;
      ctx.fillStyle = isActive ? 'rgba(245,158,11,0.34)' : hits > 1 ? 'rgba(26,127,55,0.36)' : hits === 1 ? 'rgba(26,127,55,0.16)' : '#ffffff';
      ctx.fillRect(x, y, cs, cs);
      if (cs >= 10) {
        ctx.strokeStyle = isActive ? '#9a6700' : '#d0d7de';
        ctx.lineWidth = isActive ? 1.5 : 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
      }
      if (cs >= 14) {
        ctx.fillStyle = isActive || hits > 0 ? '#1f2328' : '#59636e';
        ctx.fillText(grid.at(r, c), x + cs / 2, y + cs / 2 + 0.5);
      }
    }
  }
}

/** Renders the word-search grid, discovered emerald rays, and gold active ray onto a HiDPI canvas. */
export function renderWordSearchCanvas(
  canvas: HTMLCanvasElement, grid: WordSearchGrid, discovered: readonly WordMatch[], activeMatch: WordMatch | null, dpr = 1,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cs = Math.max(3, Math.min(36, Math.floor(520 / Math.max(grid.rows, grid.cols))));
  const width = grid.cols * cs, height = grid.rows * cs;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  drawCells(ctx, grid, buildCounts(grid, discovered), buildActiveKeys(grid.cols, activeMatch), cs);
  for (const m of discovered) {
    if (m !== activeMatch) drawRay(ctx, m, cs, 'rgba(26,127,55,0.72)', Math.max(1.5, cs * 0.12), false);
  }
  if (activeMatch) drawRay(ctx, activeMatch, cs, '#9a6700', Math.max(2.2, cs * 0.16), true);
}
