import { Grid2D } from '../../../shared/core';
import { isGuardDirection, parseGuardDirection, type GuardDirection } from './direction';

export interface CellCoord {
  readonly row: number;
  readonly col: number;
}

/** Immutable rectangular lab floorplan with obstacle mask and validated guard starting pose. */
export class LabMap {
  private readonly obstacles: Grid2D<boolean>;
  readonly startRow: number;
  readonly startCol: number;
  readonly startDir: GuardDirection;

  constructor(obstacles: Grid2D<boolean>, startRow: number, startCol: number, startDir: GuardDirection) {
    if (!obstacles.inBounds(startRow, startCol)) {
      throw new RangeError(
        `Guard start (${startRow}, ${startCol}) out of bounds for ${obstacles.rows}x${obstacles.cols}`,
      );
    }
    if (obstacles.at(startRow, startCol)) {
      throw new Error(`Guard start (${startRow}, ${startCol}) cannot be placed on an obstacle`);
    }
    if (!isGuardDirection(startDir)) {
      throw new RangeError(`Invalid guard direction: ${String(startDir)}`);
    }
    this.obstacles = obstacles;
    this.startRow = startRow;
    this.startCol = startCol;
    this.startDir = startDir;
    Object.freeze(this);
  }

  get rows(): number {
    return this.obstacles.rows;
  }

  get cols(): number {
    return this.obstacles.cols;
  }

  get size(): number {
    return this.obstacles.size;
  }

  inBounds(row: number, col: number): boolean {
    return this.obstacles.inBounds(row, col);
  }

  isObstacle(row: number, col: number): boolean {
    return this.obstacles.at(row, col);
  }
}

function validateLabChar(ch: string, row: number, col: number): string {
  if (ch === '.' || ch === '#' || parseGuardDirection(ch) !== undefined) {
    return ch;
  }
  throw new Error(`Invalid lab map character '${ch}' at (${row}, ${col})`);
}

function buildLabMap(chars: Grid2D<string>): LabMap {
  const obstacles: boolean[] = [];
  let startRow = -1;
  let startCol = -1;
  let startDir: GuardDirection | undefined;

  for (let row = 0; row < chars.rows; row += 1) {
    for (let col = 0; col < chars.cols; col += 1) {
      const ch = chars.at(row, col);
      obstacles.push(ch === '#');
      const dir = parseGuardDirection(ch);
      if (dir === undefined) continue;
      if (startDir !== undefined) {
        throw new Error('Lab map must contain exactly one guard, found multiple');
      }
      startRow = row;
      startCol = col;
      startDir = dir;
    }
  }
  if (startDir === undefined) {
    throw new Error('Lab map must contain exactly one guard, found none');
  }
  return new LabMap(new Grid2D(chars.rows, chars.cols, obstacles), startRow, startCol, startDir);
}

/** Parses a rectangular lab floorplan with `.`, `#`, and a single guard token (`^`, `>`, `v`, `<`). */
export function parseLabMap(raw: string): LabMap {
  return buildLabMap(Grid2D.fromLines(raw, validateLabChar));
}
