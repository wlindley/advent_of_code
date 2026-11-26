import { Tile, type Pose } from './types';

/** Immutable rectangular board grid storing void, open, and wall cells. */
export class MonkeyBoard {
  readonly height: number;
  readonly width: number;
  private readonly cells: Uint8Array;

  constructor(height: number, width: number, cells: Uint8Array) {
    if (!Number.isInteger(height) || height < 1) {
      throw new RangeError(`Board height must be a positive integer, got ${height}`);
    }
    if (!Number.isInteger(width) || width < 1) {
      throw new RangeError(`Board width must be a positive integer, got ${width}`);
    }
    if (cells.length !== height * width) {
      throw new RangeError(`Expected ${height * width} cells, got ${cells.length}`);
    }
    this.height = height;
    this.width = width;
    // Defensive copy without freezing the TypedArray itself (V8 disallows freezing views).
    this.cells = new Uint8Array(cells);
    Object.freeze(this);
  }

  /** Total number of non-void cells on the board, computed dynamically. */
  get playableTileCount(): number {
    let count = 0;
    for (let i = 0; i < this.cells.length; i += 1) {
      if (this.cells[i] !== Tile.Void) count += 1;
    }
    return count;
  }

  /** Returns the tile at (row, col), or Tile.Void when out of bounds. */
  tileAt(row: number, col: number): Tile {
    if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
      return Tile.Void;
    }
    return this.cells[row * this.width + col]! as Tile;
  }

  /** Returns true when (row, col) lies on a non-void tile. */
  isPlayable(row: number, col: number): boolean {
    return this.tileAt(row, col) !== Tile.Void;
  }

  /** Returns the leftmost open tile on row 0 facing right (0). */
  findStartPose(): Pose {
    for (let col = 0; col < this.width; col += 1) {
      if (this.tileAt(0, col) === Tile.Open) {
        return { row: 0, col, facing: 0 };
      }
    }
    throw new Error('Row 0 contains no open tile');
  }
}
