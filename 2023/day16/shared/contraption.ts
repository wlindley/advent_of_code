import {
  type BeamState,
  createBeamState,
  decodeTileCode,
  DIR_E,
  DIR_N,
  DIR_S,
  DIR_W,
  encodeTileChar,
  type TileChar,
  type TileCode,
} from './optics';

/** Immutable 2D optical mirror/splitter contraption grid backed by a flat `Uint8Array`. */
export class Contraption {
  readonly #tiles: Uint8Array;
  readonly height: number;
  readonly width: number;

  private constructor(tiles: Uint8Array, height: number, width: number) {
    this.#tiles = tiles;
    this.height = height;
    this.width = width;
    Object.freeze(this);
  }

  /** Builds a `Contraption` from uniform-width lines of valid tile characters. */
  static fromLines(lines: readonly string[]): Contraption {
    if (lines.length === 0) {
      throw new Error('Contraption grid must contain at least one row');
    }
    const width = lines[0]!.length;
    if (width === 0) {
      throw new Error('Contraption grid rows must be non-empty');
    }
    const tiles = new Uint8Array(lines.length * width);
    for (let r = 0; r < lines.length; r += 1) {
      const line = lines[r]!;
      if (line.length !== width) {
        throw new RangeError(`Row ${r} has width ${line.length}, expected ${width}`);
      }
      const rowOffset = r * width;
      for (let c = 0; c < width; c += 1) {
        tiles[rowOffset + c] = encodeTileChar(line[c]!);
      }
    }
    return new Contraption(tiles, lines.length, width);
  }

  /** Total number of cells (`height * width`). */
  get size(): number {
    return this.height * this.width;
  }

  /** Returns `true` when `(row, col)` is an integer coordinate inside the grid. */
  inBounds(row: number, col: number): boolean {
    return (
      Number.isInteger(row) &&
      Number.isInteger(col) &&
      row >= 0 &&
      row < this.height &&
      col >= 0 &&
      col < this.width
    );
  }

  /** Returns the encoded `TileCode` at `(row, col)`, throwing `RangeError` if out of bounds. */
  tileCodeAt(row: number, col: number): TileCode {
    if (!this.inBounds(row, col)) {
      throw new RangeError(`Cell (${row}, ${col}) out of bounds for ${this.height}x${this.width}`);
    }
    return this.#tiles[row * this.width + col]! as TileCode;
  }

  /** Returns the character tile at `(row, col)`, throwing `RangeError` if out of bounds. */
  tileAt(row: number, col: number): TileChar {
    return decodeTileCode(this.tileCodeAt(row, col));
  }

  /** Returns a defensive copy of the row-major tile buffer. */
  copyTiles(): Uint8Array {
    return this.#tiles.slice();
  }

  /** Lists all `2 * (height + width)` inward perimeter entry states (top, bottom, left, right). */
  edgeEntries(): readonly BeamState[] {
    const entries: BeamState[] = [];
    for (let c = 0; c < this.width; c += 1) entries.push(createBeamState(0, c, DIR_S));
    for (let c = 0; c < this.width; c += 1) entries.push(createBeamState(this.height - 1, c, DIR_N));
    for (let r = 0; r < this.height; r += 1) entries.push(createBeamState(r, 0, DIR_E));
    for (let r = 0; r < this.height; r += 1) entries.push(createBeamState(r, this.width - 1, DIR_W));
    return Object.freeze(entries);
  }

  /** Serializes the contraption back into row strings. */
  toLines(): readonly string[] {
    const lines: string[] = [];
    for (let r = 0; r < this.height; r += 1) {
      let row = '';
      const rowOffset = r * this.width;
      for (let c = 0; c < this.width; c += 1) {
        row += decodeTileCode(this.#tiles[rowOffset + c]! as TileCode);
      }
      lines.push(row);
    }
    return Object.freeze(lines);
  }
}

/** Parses raw puzzle text into an immutable `Contraption` grid. */
export function parseContraption(raw: string): Contraption {
  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  if (normalized.length === 0) {
    throw new Error('Contraption input must not be empty');
  }
  return Contraption.fromLines(normalized.split('\n'));
}
