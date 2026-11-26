export const TILE_EMPTY = 0;
export const TILE_WALL = 1;
export const TILE_BOX = 2;
export const TILE_BOX_LEFT = 3;
export const TILE_BOX_RIGHT = 4;
export const TILE_ROBOT = 5;

export type TileCode = 0 | 1 | 2 | 3 | 4 | 5;
export type PlaceableTileCode = 0 | 2 | 3 | 4;

const TILE_TO_CHAR: readonly string[] = ['.', '#', 'O', '[', ']', '@'];
const CHAR_TO_TILE = new Map<string, TileCode>([
  ['.', TILE_EMPTY], ['#', TILE_WALL], ['O', TILE_BOX],
  ['[', TILE_BOX_LEFT], [']', TILE_BOX_RIGHT], ['@', TILE_ROBOT],
]);

function isInBounds(row: number, col: number, width: number, height: number): boolean {
  return Number.isInteger(row) && Number.isInteger(col) && row >= 0 && row < height && col >= 0 && col < width;
}

function readCell(cells: Uint8Array, width: number, height: number, row: number, col: number): TileCode {
  return isInBounds(row, col, width, height) ? (cells[row * width + col] as TileCode) : TILE_WALL;
}

function computeGpsSum(cells: Uint8Array, width: number, height: number): number {
  let sum = 0;
  for (let r = 0; r < height; r += 1) {
    for (let c = 0; c < width; c += 1) {
      const tile = cells[r * width + c];
      if (tile === TILE_BOX || tile === TILE_BOX_LEFT) sum += 100 * r + c;
    }
  }
  return sum;
}

function countBoxes(cells: Uint8Array): number {
  let count = 0;
  for (const tile of cells) {
    if (tile === TILE_BOX || tile === TILE_BOX_LEFT) count += 1;
  }
  return count;
}

function formatAsciiRows(cells: Uint8Array, width: number, height: number): readonly string[] {
  const rows: string[] = [];
  for (let r = 0; r < height; r += 1) {
    let line = '';
    for (let c = 0; c < width; c += 1) line += TILE_TO_CHAR[cells[r * width + c]!]!;
    rows.push(line);
  }
  return Object.freeze(rows);
}

function decodeTile(row: string, r: number, c: number): TileCode {
  const tile = CHAR_TO_TILE.get(row[c]!);
  if (tile === undefined) throw new Error(`Invalid tile '${row[c]}' at (${r}, ${c})`);
  if (tile === TILE_BOX_LEFT && row[c + 1] !== ']') throw new Error(`Unpaired '[' bracket at (${r}, ${c})`);
  if (tile === TILE_BOX_RIGHT && row[c - 1] !== '[') throw new Error(`Unpaired ']' bracket at (${r}, ${c})`);
  return tile;
}

/** Immutable point-in-time view of a warehouse grid and robot position. */
export class WarehouseSnapshot {
  readonly #cells: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly robotRow: number;
  readonly robotCol: number;

  constructor(cells: Uint8Array, width: number, height: number, robotRow: number, robotCol: number) {
    this.#cells = new Uint8Array(cells);
    this.width = width;
    this.height = height;
    this.robotRow = robotRow;
    this.robotCol = robotCol;
    Object.freeze(this);
  }

  cellAt(row: number, col: number): TileCode { return readCell(this.#cells, this.width, this.height, row, col); }
  get gpsSum(): number { return computeGpsSum(this.#cells, this.width, this.height); }
  get boxCount(): number { return countBoxes(this.#cells); }
  toAsciiRows(): readonly string[] { return formatAsciiRows(this.#cells, this.width, this.height); }
}

/** Encapsulated mutable warehouse grid for O(1) simulation steps. */
export class WarehouseState {
  readonly #cells: Uint8Array;
  readonly width: number;
  readonly height: number;
  #robotRow: number;
  #robotCol: number;

  private constructor(cells: Uint8Array, width: number, height: number, robotRow: number, robotCol: number) {
    this.#cells = cells;
    this.width = width;
    this.height = height;
    this.#robotRow = robotRow;
    this.#robotCol = robotCol;
  }

  static fromRows(rows: readonly string[]): WarehouseState {
    if (rows.length === 0 || rows[0]!.length === 0) throw new Error('Warehouse rows must be non-empty');
    const height = rows.length;
    const width = rows[0]!.length;
    const cells = new Uint8Array(width * height);
    let robotRow = -1;
    let robotCol = -1;
    let robotCount = 0;

    for (let r = 0; r < height; r += 1) {
      const row = rows[r]!;
      if (row.length !== width) throw new Error(`Warehouse map must be rectangular: row ${r} has width ${row.length}`);
      for (let c = 0; c < width; c += 1) {
        const tile = decodeTile(row, r, c);
        if (tile === TILE_ROBOT) { robotRow = r; robotCol = c; robotCount += 1; }
        cells[r * width + c] = tile;
      }
    }
    if (robotCount !== 1) throw new Error(`Warehouse must have exactly one robot, found ${robotCount}`);
    return new WarehouseState(cells, width, height, robotRow, robotCol);
  }

  get robotRow(): number { return this.#robotRow; }
  get robotCol(): number { return this.#robotCol; }
  get gpsSum(): number { return computeGpsSum(this.#cells, this.width, this.height); }
  cellAt(row: number, col: number): TileCode { return readCell(this.#cells, this.width, this.height, row, col); }

  setTile(row: number, col: number, tile: PlaceableTileCode): void {
    this.#assertInBounds(row, col);
    if (row === this.#robotRow && col === this.#robotCol) throw new Error(`Cannot overwrite robot at (${row}, ${col})`);
    this.#cells[row * this.width + col] = tile;
  }

  moveRobotTo(row: number, col: number): void {
    this.#assertInBounds(row, col);
    const nextIdx = row * this.width + col;
    if (this.#cells[nextIdx] === TILE_WALL) throw new Error(`Cannot move robot into wall at (${row}, ${col})`);
    this.#cells[this.#robotRow * this.width + this.#robotCol] = TILE_EMPTY;
    this.#cells[nextIdx] = TILE_ROBOT;
    this.#robotRow = row;
    this.#robotCol = col;
  }

  snapshot(): WarehouseSnapshot {
    return new WarehouseSnapshot(this.#cells, this.width, this.height, this.#robotRow, this.#robotCol);
  }

  #assertInBounds(row: number, col: number): void {
    if (!isInBounds(row, col, this.width, this.height)) {
      throw new RangeError(`Cell (${row}, ${col}) out of bounds for ${this.width}x${this.height}`);
    }
  }
}
