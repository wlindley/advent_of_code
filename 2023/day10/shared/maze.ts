import { DIRS_4, Grid2D } from '../../../shared/core';
import {
  DIR_BITS,
  bitToDirIndex,
  createCoord,
  maskToPipeShape,
  oppositeBit,
  parsePipeSymbol,
  tileMask,
  type DirBit,
  type GridCoord,
  type PipeShape,
  type PipeSymbol,
  type PipeTile,
} from './pipes';

/** Immutable parsed pipe maze with inferred start pipe shape and port-validated stepping. */
export class PipeMaze {
  private readonly grid: Grid2D<PipeSymbol>;
  readonly start: GridCoord;
  readonly inferredStartTile: PipeShape;

  constructor(grid: Grid2D<PipeSymbol>, start: GridCoord, inferredStartTile: PipeShape) {
    this.grid = grid;
    this.start = start;
    this.inferredStartTile = inferredStartTile;
    Object.freeze(this);
  }

  get rows(): number {
    return this.grid.rows;
  }

  get cols(): number {
    return this.grid.cols;
  }

  get size(): number {
    return this.grid.size;
  }

  inBounds(row: number, col: number): boolean {
    return this.grid.inBounds(row, col);
  }

  rawAt(row: number, col: number): PipeSymbol {
    return this.grid.at(row, col);
  }

  effectiveTileAt(row: number, col: number): PipeTile {
    const raw = this.grid.at(row, col);
    return raw === 'S' ? this.inferredStartTile : raw;
  }

  effectiveMaskAt(row: number, col: number): number {
    return tileMask(this.effectiveTileAt(row, col));
  }

  /** Steps one cell along `dirBit` only if both origin and neighbor expose reciprocal ports. */
  stepFrom(coord: GridCoord, dirBit: DirBit): GridCoord | null {
    if (!this.inBounds(coord.row, coord.col)) {
      throw new RangeError(`Origin (${coord.row}, ${coord.col}) out of bounds for ${this.rows}x${this.cols}`);
    }
    if ((this.effectiveMaskAt(coord.row, coord.col) & dirBit) === 0) return null;

    const [dr, dc] = DIRS_4[bitToDirIndex(dirBit)]!;
    const nextRow = coord.row + dr;
    const nextCol = coord.col + dc;
    if (!this.inBounds(nextRow, nextCol)) return null;
    if ((this.effectiveMaskAt(nextRow, nextCol) & oppositeBit(dirBit)) === 0) return null;

    return createCoord(nextRow, nextCol);
  }
}

function findStartCoord(grid: Grid2D<PipeSymbol>): GridCoord {
  let found: GridCoord | null = null;
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      if (grid.at(row, col) !== 'S') continue;
      if (found) {
        throw new Error(`Multiple start tiles "S" found at (${found.row}, ${found.col}) and (${row}, ${col})`);
      }
      found = createCoord(row, col);
    }
  }
  if (!found) {
    throw new Error('Missing start tile "S"');
  }
  return found;
}

function inferStartShape(grid: Grid2D<PipeSymbol>, start: GridCoord): PipeShape {
  let mask = 0;
  for (const bit of DIR_BITS) {
    const [dr, dc] = DIRS_4[bitToDirIndex(bit)]!;
    const nr = start.row + dr;
    const nc = start.col + dc;
    if (!grid.inBounds(nr, nc)) continue;
    // Safe: findStartCoord guarantees 'S' is unique and (nr, nc) !== start.
    const neighborTile = grid.at(nr, nc) as PipeTile;
    if ((tileMask(neighborTile) & oppositeBit(bit)) !== 0) {
      mask |= bit;
    }
  }
  try {
    return maskToPipeShape(mask);
  } catch {
    throw new Error(`Start tile "S" at (${start.row}, ${start.col}) must have degree 2 (mask=${mask})`);
  }
}

/** Parses raw puzzle text into a validated `PipeMaze`. */
export function parsePipeMaze(raw: string): PipeMaze {
  const grid = Grid2D.fromLines(raw, parsePipeSymbol);
  const start = findStartCoord(grid);
  const inferred = inferStartShape(grid, start);
  return new PipeMaze(grid, start, inferred);
}
