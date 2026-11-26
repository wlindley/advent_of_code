import type { WordSearchGrid } from '../../shared';
import type { XMasCross, XMasOrientation } from '../domain';

export interface OrientationStyle {
  readonly label: string;
  readonly stroke: string;
  readonly tint: string;
}

export const ORIENTATION_STYLES: Readonly<Record<XMasOrientation, OrientationStyle>> = Object.freeze({
  M_LEFT: Object.freeze({ label: 'M Left', stroke: '#1a7f37', tint: 'rgba(26, 127, 55, 0.16)' }),
  M_RIGHT: Object.freeze({ label: 'M Right', stroke: '#0969da', tint: 'rgba(9, 105, 218, 0.16)' }),
  M_TOP: Object.freeze({ label: 'M Top', stroke: '#8250df', tint: 'rgba(130, 80, 223, 0.16)' }),
  M_BOTTOM: Object.freeze({ label: 'M Bottom', stroke: '#0e7c7b', tint: 'rgba(14, 124, 123, 0.16)' }),
});

interface CellOverlay {
  readonly counts: Uint16Array;
  readonly firstOrientation: (XMasOrientation | undefined)[];
  readonly activeKeys: Set<number>;
}

function buildCellOverlay(
  grid: WordSearchGrid,
  discovered: readonly XMasCross[],
  active: XMasCross | null,
): CellOverlay {
  const counts = new Uint16Array(grid.size);
  const firstOrientation: (XMasOrientation | undefined)[] = new Array(grid.size);
  for (const cross of discovered) {
    for (const cell of cross.cells) {
      const idx = cell.row * grid.cols + cell.col;
      counts[idx]! += 1;
      firstOrientation[idx] ??= cross.orientation;
    }
  }
  const activeKeys = new Set<number>();
  if (active) {
    for (const cell of active.cells) activeKeys.add(cell.row * grid.cols + cell.col);
  }
  return { counts, firstOrientation, activeKeys };
}

function cellBackground(hits: number, orientation: XMasOrientation | undefined, isActive: boolean): string {
  if (isActive) return 'rgba(245, 158, 11, 0.32)';
  if (hits > 1) return 'rgba(31, 35, 40, 0.18)';
  if (hits === 1 && orientation) return ORIENTATION_STYLES[orientation].tint;
  return '#ffffff';
}

function drawCells(
  ctx: CanvasRenderingContext2D,
  grid: WordSearchGrid,
  overlay: CellOverlay,
  maskUnused: boolean,
  cs: number,
): void {
  if (cs >= 14) {
    ctx.font = `700 ${Math.floor(cs * 0.54)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  }
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const idx = r * grid.cols + c, hits = overlay.counts[idx]!, isActive = overlay.activeKeys.has(idx);
      const x = c * cs, y = r * cs;
      ctx.fillStyle = cellBackground(hits, overlay.firstOrientation[idx], isActive);
      ctx.fillRect(x, y, cs, cs);
      if (cs >= 10) {
        ctx.strokeStyle = isActive ? '#9a6700' : '#d0d7de';
        ctx.lineWidth = isActive ? 1.5 : 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
      }
      if (cs >= 14) {
        const used = isActive || hits > 0;
        ctx.fillStyle = used ? '#1f2328' : '#59636e';
        ctx.fillText(maskUnused && !used ? '.' : grid.at(r, c), x + cs / 2, y + cs / 2 + 0.5);
      }
    }
  }
}

function drawCrossStrokes(
  ctx: CanvasRenderingContext2D,
  cross: XMasCross,
  cs: number,
  color: string,
  width: number,
  showMarkers: boolean,
): void {
  const half = cs / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  for (const diag of cross.diagonals) {
    ctx.beginPath();
    ctx.moveTo(diag.from.col * cs + half, diag.from.row * cs + half);
    ctx.lineTo(diag.to.col * cs + half, diag.to.row * cs + half);
    ctx.stroke();
    if (showMarkers) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(diag.from.col * cs + half, diag.from.row * cs + half, Math.max(2.2, cs * 0.16), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (showMarkers) {
    ctx.beginPath();
    ctx.arc(cross.centerCol * cs + half, cross.centerRow * cs + half, Math.max(3, cs * 0.24), 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Renders the X-MAS grid, orientation-colored crosses, overlap shading, and active gold highlight. */
export function renderXMasCanvas(
  canvas: HTMLCanvasElement,
  grid: WordSearchGrid,
  discovered: readonly XMasCross[],
  activeCross: XMasCross | null,
  maskUnused: boolean,
  dpr = 1,
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
  drawCells(ctx, grid, buildCellOverlay(grid, discovered, activeCross), maskUnused, cs);
  for (const cross of discovered) {
    if (cross !== activeCross) {
      drawCrossStrokes(ctx, cross, cs, ORIENTATION_STYLES[cross.orientation].stroke, Math.max(1.5, cs * 0.12), false);
    }
  }
  if (activeCross) {
    drawCrossStrokes(ctx, activeCross, cs, '#9a6700', Math.max(2.2, cs * 0.16), true);
  }
}
