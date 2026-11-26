export type Direction = 0 | 1 | 2 | 3;
export const DIR_NORTH: Direction = 0;
export const DIR_EAST: Direction = 1;
export const DIR_SOUTH: Direction = 2;
export const DIR_WEST: Direction = 3;

export type DirDelta = readonly [dr: number, dc: number];
export const DIR_DELTAS: readonly [DirDelta, DirDelta, DirDelta, DirDelta] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
export const STEP_COST = 1;
export const TURN_COST = 1000;

export interface PathStep {
  readonly row: number;
  readonly col: number;
  readonly dir: Direction;
  readonly cost: number;
}

export const turnCw = (d: Direction): Direction => ((d + 1) & 3) as Direction;
export const turnCcw = (d: Direction): Direction => ((d + 3) & 3) as Direction;
export const oppositeDir = (d: Direction): Direction => ((d + 2) & 3) as Direction;

function assertIntInRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} out of range [${min}, ${max}]: ${value}`);
  }
}

/** Immutable grid representation of a Reindeer Maze with flat wall storage. */
export class ReindeerMaze {
  readonly width: number;
  readonly height: number;
  readonly startCell: number;
  readonly endCell: number;
  private readonly walls: Uint8Array;

  constructor(width: number, height: number, walls: Uint8Array, startCell: number, endCell: number) {
    assertIntInRange(width, 1, Number.MAX_SAFE_INTEGER, 'width');
    assertIntInRange(height, 1, Number.MAX_SAFE_INTEGER, 'height');
    const total = width * height;
    if (walls.length !== total) throw new RangeError(`walls length ${walls.length} !== ${total}`);
    assertIntInRange(startCell, 0, total - 1, 'startCell');
    assertIntInRange(endCell, 0, total - 1, 'endCell');
    if (startCell === endCell) throw new RangeError('startCell and endCell must differ');
    if (walls[startCell]! !== 0 || walls[endCell]! !== 0) {
      throw new RangeError('startCell and endCell must be open floor tiles');
    }
    this.width = width;
    this.height = height;
    this.startCell = startCell;
    this.endCell = endCell;
    this.walls = new Uint8Array(walls);
    Object.freeze(this);
  }

  get cellCount(): number {
    return this.width * this.height;
  }

  cellIndex(r: number, c: number): number {
    assertIntInRange(r, 0, this.height - 1, 'row');
    assertIntInRange(c, 0, this.width - 1, 'col');
    return r * this.width + c;
  }

  rowOf(cell: number): number {
    assertIntInRange(cell, 0, this.cellCount - 1, 'cell');
    return Math.floor(cell / this.width);
  }

  colOf(cell: number): number {
    assertIntInRange(cell, 0, this.cellCount - 1, 'cell');
    return cell % this.width;
  }

  isWallCell(cell: number): boolean {
    assertIntInRange(cell, 0, this.cellCount - 1, 'cell');
    return this.walls[cell]! !== 0;
  }

  isWall(r: number, c: number): boolean {
    return this.walls[this.cellIndex(r, c)]! !== 0;
  }

  neighborCell(cell: number, dir: Direction): number {
    const r = this.rowOf(cell);
    const c = cell % this.width;
    const [dr, dc] = DIR_DELTAS[dir];
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= this.height || nc < 0 || nc >= this.width) return -1;
    const next = nr * this.width + nc;
    return this.walls[next]! !== 0 ? -1 : next;
  }
}
