import type { PipeMaze } from './maze';
import { oppositeBit, otherPort, pipePorts, type GridCoord, type PipeShape } from './pipes';

function assertInBounds(row: number, col: number, rows: number, cols: number): void {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= rows || col < 0 || col >= cols) {
    throw new RangeError(`Coordinate (${row}, ${col}) out of bounds for ${rows}x${cols}`);
  }
}

function buildCycleIndexTable(rows: number, cols: number, tiles: readonly GridCoord[]): Int32Array {
  const table = new Int32Array(rows * cols).fill(-1);
  for (let i = 0; i < tiles.length; i += 1) {
    const coord = tiles[i]!;
    assertInBounds(coord.row, coord.col, rows, cols);
    const cellIdx = coord.row * cols + coord.col;
    if (table[cellIdx] !== -1) {
      throw new Error(`Duplicate loop coordinate at (${coord.row}, ${coord.col})`);
    }
    table[cellIdx] = i;
  }
  return table;
}

/** Immutable main cycle of a pipe maze with O(1) per-cell membership and distance lookup. */
export class MainLoop {
  readonly rows: number;
  readonly cols: number;
  readonly tiles: readonly GridCoord[];
  // Why: TypedArrays throw TypeError if frozen; keeping it private preserves immutability.
  private readonly cycleIndexByCell: Int32Array;

  constructor(rows: number, cols: number, tiles: readonly GridCoord[]) {
    if (!Number.isInteger(rows) || rows <= 0 || !Number.isInteger(cols) || cols <= 0) {
      throw new RangeError(`Grid dimensions must be positive integers, got ${rows}x${cols}`);
    }
    if (tiles.length < 4 || tiles.length % 2 !== 0) {
      throw new Error(`Main loop length must be an even integer >= 4, got ${tiles.length}`);
    }
    this.rows = rows;
    this.cols = cols;
    this.tiles = Object.freeze(tiles.slice());
    this.cycleIndexByCell = buildCycleIndexTable(rows, cols, this.tiles);
    Object.freeze(this);
  }

  get length(): number {
    return this.tiles.length;
  }

  get farthestDistance(): number {
    return this.tiles.length / 2;
  }

  get farthestCoord(): GridCoord {
    return this.tiles[this.farthestDistance]!;
  }

  cycleIndexAt(row: number, col: number): number {
    assertInBounds(row, col, this.rows, this.cols);
    return this.cycleIndexByCell[row * this.cols + col]!;
  }

  isOnLoop(row: number, col: number): boolean {
    return this.cycleIndexAt(row, col) >= 0;
  }

  distanceAt(row: number, col: number): number {
    const idx = this.cycleIndexAt(row, col);
    return idx < 0 ? -1 : Math.min(idx, this.length - idx);
  }
}

/** Traces the unique closed loop containing `maze.start` in O(L) time. */
export function traceMainLoop(maze: PipeMaze): MainLoop {
  const [firstOutDir] = pipePorts(maze.inferredStartTile);
  const tiles: GridCoord[] = [maze.start];
  let curr = maze.start;
  let outDir = firstOutDir;

  // Why: every non-S pipe has degree <= 2 and S has degree 2, so walking from S can
  // only hit a dead-end (stepFrom === null) or return cleanly to S via its second port.
  while (true) {
    const next = maze.stepFrom(curr, outDir);
    if (!next) {
      throw new Error(`Main loop broke at (${curr.row}, ${curr.col})`);
    }
    if (next.row === maze.start.row && next.col === maze.start.col) {
      break;
    }
    tiles.push(next);
    const nextShape = maze.effectiveTileAt(next.row, next.col) as PipeShape;
    outDir = otherPort(nextShape, oppositeBit(outDir));
    curr = next;
  }

  return new MainLoop(maze.rows, maze.cols, tiles);
}
