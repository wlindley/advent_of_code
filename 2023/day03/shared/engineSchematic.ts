import { DIRS_8, Grid2D } from '../../../shared/core';
import { PartNumber } from './partNumber';
import { isAsciiDigit, isSchematicSymbol, SchematicSymbol } from './schematicSymbol';

function validateCell(ch: string): string {
  if (/\s/.test(ch)) {
    throw new SyntaxError(`Schematic cannot contain whitespace cell ${JSON.stringify(ch)}`);
  }
  return ch;
}

function flushPartNumber(
  out: PartNumber[],
  nextId: number,
  row: number,
  startCol: number,
  endCol: number,
  value: number,
): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Part number at (${row}, ${startCol}) exceeds safe integer range`);
  }
  out.push(new PartNumber(nextId, row, startCol, endCol, value));
  return nextId + 1;
}

function extractRowNumbers(
  grid: Grid2D<string>,
  row: number,
  startId: number,
  out: PartNumber[],
): number {
  let nextId = startId;
  let startCol = -1;
  let value = 0;
  for (let col = 0; col < grid.cols; col += 1) {
    const ch = grid.at(row, col);
    if (isAsciiDigit(ch)) {
      if (startCol < 0) {
        startCol = col;
        value = 0;
      }
      value = value * 10 + (ch.charCodeAt(0) - 48);
    } else if (startCol >= 0) {
      nextId = flushPartNumber(out, nextId, row, startCol, col - 1, value);
      startCol = -1;
    }
  }
  if (startCol >= 0) {
    nextId = flushPartNumber(out, nextId, row, startCol, grid.cols - 1, value);
  }
  return nextId;
}

function extractSymbols(grid: Grid2D<string>): readonly SchematicSymbol[] {
  const symbols: SchematicSymbol[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const ch = grid.at(row, col);
      if (isSchematicSymbol(ch)) {
        symbols.push(new SchematicSymbol(symbols.length, row, col, ch));
      }
    }
  }
  return Object.freeze(symbols);
}

function buildCellToNumberId(
  rows: number,
  cols: number,
  numbers: readonly PartNumber[],
): Int32Array {
  const cellToNumberId = new Int32Array(rows * cols).fill(-1);
  for (const part of numbers) {
    const offset = part.row * cols;
    for (let col = part.startCol; col <= part.endCol; col += 1) {
      cellToNumberId[offset + col] = part.id;
    }
  }
  return cellToNumberId;
}

/** Immutable parsed 2D engine schematic indexing part numbers and symbols for O(1) neighbor lookup. */
export class EngineSchematic {
  readonly grid: Grid2D<string>;
  readonly numbers: readonly PartNumber[];
  readonly symbols: readonly SchematicSymbol[];
  private readonly cellToNumberId: Int32Array;

  private constructor(
    grid: Grid2D<string>,
    numbers: readonly PartNumber[],
    symbols: readonly SchematicSymbol[],
    cellToNumberId: Int32Array,
  ) {
    this.grid = grid;
    this.numbers = numbers;
    this.symbols = symbols;
    this.cellToNumberId = cellToNumberId;
    Object.freeze(this);
  }

  get rows(): number {
    return this.grid.rows;
  }

  get cols(): number {
    return this.grid.cols;
  }

  /** Parses a rectangular schematic string into frozen grid, numbers, symbols, and cell index. */
  static parse(raw: string): EngineSchematic {
    const grid = Grid2D.fromLines(raw, validateCell);
    const numbers: PartNumber[] = [];
    let nextId = 0;
    for (let row = 0; row < grid.rows; row += 1) {
      nextId = extractRowNumbers(grid, row, nextId, numbers);
    }
    const frozenNumbers = Object.freeze(numbers);
    const symbols = extractSymbols(grid);
    const cellToNumberId = buildCellToNumberId(grid.rows, grid.cols, frozenNumbers);
    return new EngineSchematic(grid, frozenNumbers, symbols, cellToNumberId);
  }

  /** Returns deduplicated part numbers within the 8-neighborhood of `symbol`. */
  adjacentNumbersOf(symbol: SchematicSymbol): readonly PartNumber[] {
    if (!this.grid.inBounds(symbol.row, symbol.col)) {
      throw new RangeError(
        `Symbol (${symbol.row}, ${symbol.col}) out of bounds for ${this.rows}x${this.cols}`,
      );
    }
    const seenIds = new Set<number>();
    const result: PartNumber[] = [];
    for (const [dr, dc] of DIRS_8) {
      const nr = symbol.row + dr;
      const nc = symbol.col + dc;
      if (!this.grid.inBounds(nr, nc)) continue;
      const partId = this.cellToNumberId[nr * this.grid.cols + nc]!;
      if (partId >= 0 && !seenIds.has(partId)) {
        seenIds.add(partId);
        result.push(this.numbers[partId]!);
      }
    }
    return Object.freeze(result);
  }
}
