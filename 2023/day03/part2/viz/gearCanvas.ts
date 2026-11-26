import type { EngineSchematic, SchematicSymbol } from '../../shared';
import type { GearTraceFrame } from '../domain';

export const LENS_RADIUS = 7;

export interface WindowBounds {
  readonly rowStart: number;
  readonly rowEnd: number;
  readonly colStart: number;
  readonly colEnd: number;
}

/** Computes a clamped 15x15 (or smaller) window centered around `(centerRow, centerCol)`. */
export function computeLensBounds(rows: number, cols: number, centerRow: number, centerCol: number): WindowBounds {
  const span = LENS_RADIUS * 2 + 1;
  const rowStart = Math.max(0, Math.min(rows - span, centerRow - LENS_RADIUS));
  const colStart = Math.max(0, Math.min(cols - span, centerCol - LENS_RADIUS));
  return {
    rowStart,
    rowEnd: Math.min(rows - 1, rowStart + span - 1),
    colStart,
    colEnd: Math.min(cols - 1, colStart + span - 1),
  };
}

/** Computes overview canvas pixel size per schematic cell. */
export function computeOverviewCellPx(rows: number, cols: number): number {
  return Math.max(2, Math.min(8, Math.floor(360 / Math.max(rows, cols))));
}

function drawPartsLayer(
  ctx: CanvasRenderingContext2D,
  schematic: EngineSchematic,
  gearPartSet: ReadonlySet<number>,
  activeSet: ReadonlySet<number>,
  activeIsGear: boolean,
  cellPx: number,
): void {
  for (const part of schematic.numbers) {
    ctx.fillStyle = activeSet.has(part.id)
      ? activeIsGear ? '#9a6700' : '#0969da'
      : gearPartSet.has(part.id) ? '#1a7f37' : '#94a3b8';
    ctx.fillRect(part.startCol * cellPx, part.row * cellPx, part.length * cellPx, cellPx);
  }
}

function drawSymbolsLayer(
  ctx: CanvasRenderingContext2D,
  schematic: EngineSchematic,
  confirmedSet: ReadonlySet<number>,
  frame: GearTraceFrame,
  cellPx: number,
): void {
  for (const sym of schematic.symbols) {
    if (!sym.isGearCandidate) {
      ctx.fillStyle = '#e2e8f0';
    } else if (sym.id === frame.symbol.id) {
      ctx.fillStyle = frame.isGear ? '#9a6700' : '#0969da';
    } else {
      ctx.fillStyle = confirmedSet.has(sym.id) ? '#1a7f37' : sym.id < frame.symbol.id ? '#64748b' : '#cbd5e1';
    }
    ctx.fillRect(sym.col * cellPx, sym.row * cellPx, cellPx, cellPx);
  }
}

function drawLensBox(ctx: CanvasRenderingContext2D, schematic: EngineSchematic, sym: SchematicSymbol, cellPx: number): void {
  const b = computeLensBounds(schematic.rows, schematic.cols, sym.row, sym.col);
  ctx.strokeStyle = '#0969da';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    b.colStart * cellPx + 0.5,
    b.rowStart * cellPx + 0.5,
    (b.colEnd - b.colStart + 1) * cellPx - 1,
    (b.rowEnd - b.rowStart + 1) * cellPx - 1,
  );
}

/** Draws the full schematic overview onto a 2D canvas highlighting gears, decoys, and the 15x15 lens. */
export function drawGearOverview(
  canvas: HTMLCanvasElement,
  schematic: EngineSchematic,
  frame: GearTraceFrame,
  cellPx: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#f6f8fa';
  ctx.fillRect(0, 0, schematic.cols * cellPx, schematic.rows * cellPx);
  const activeSet = new Set(frame.adjacentParts.map((p) => p.id));
  drawPartsLayer(ctx, schematic, new Set(frame.gearPartIds), activeSet, frame.isGear, cellPx);
  drawSymbolsLayer(ctx, schematic, new Set(frame.confirmedGearIds), frame, cellPx);
  drawLensBox(ctx, schematic, frame.symbol, cellPx);
}
