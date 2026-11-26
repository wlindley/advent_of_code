import type { EngineSchematic, SchematicSymbol } from '../../shared';
import type { SchematicTraceFrame } from '../domain';

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

function drawNumbersLayer(
  ctx: CanvasRenderingContext2D,
  schematic: EngineSchematic,
  matchedSet: ReadonlySet<number>,
  newlySet: ReadonlySet<number>,
  cellPx: number,
): void {
  for (const part of schematic.numbers) {
    ctx.fillStyle = newlySet.has(part.id) ? '#9a6700' : matchedSet.has(part.id) ? '#1a7f37' : '#94a3b8';
    ctx.fillRect(part.startCol * cellPx, part.row * cellPx, part.length * cellPx, cellPx);
  }
}

function drawSymbolsLayer(
  ctx: CanvasRenderingContext2D,
  schematic: EngineSchematic,
  activeSymbol: SchematicSymbol,
  cellPx: number,
): void {
  for (const sym of schematic.symbols) {
    ctx.fillStyle = sym.id === activeSymbol.id ? '#0969da' : sym.id < activeSymbol.id ? '#59636e' : '#cbd5e1';
    ctx.fillRect(sym.col * cellPx, sym.row * cellPx, cellPx, cellPx);
  }
}

function drawLensBox(ctx: CanvasRenderingContext2D, schematic: EngineSchematic, activeSymbol: SchematicSymbol, cellPx: number): void {
  const b = computeLensBounds(schematic.rows, schematic.cols, activeSymbol.row, activeSymbol.col);
  ctx.strokeStyle = '#0969da';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    b.colStart * cellPx + 0.5,
    b.rowStart * cellPx + 0.5,
    (b.colEnd - b.colStart + 1) * cellPx - 1,
    (b.rowEnd - b.rowStart + 1) * cellPx - 1,
  );
}

/** Draws the full schematic overview onto a 2D canvas with active 15x15 lens indicator. */
export function drawSchematicOverview(
  canvas: HTMLCanvasElement,
  schematic: EngineSchematic,
  frame: SchematicTraceFrame,
  cellPx: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#f6f8fa';
  ctx.fillRect(0, 0, schematic.cols * cellPx, schematic.rows * cellPx);
  drawNumbersLayer(ctx, schematic, new Set(frame.matchedPartIds), new Set(frame.newlyMatchedIds), cellPx);
  drawSymbolsLayer(ctx, schematic, frame.symbol, cellPx);
  drawLensBox(ctx, schematic, frame.symbol, cellPx);
}
