import {
  CELL_ROUND,
  encodeCellChar,
  type CellChar,
  type TiltDirection,
} from './cell';
import { tiltBuffer } from './sweep';

const ASCII_DECODER = new TextDecoder('ascii');

function validateAxisIndex(index: number, limit: number, axis: 'row' | 'col'): void {
  if (!Number.isInteger(index) || index < 0 || index >= limit) {
    throw new RangeError(`${axis} index ${index} out of bounds [0, ${limit})`);
  }
}

/** Immutable parabolic reflector dish platform with row-major ASCII cell storage. */
export class DishPlatform {
  readonly #cells: Uint8Array;
  readonly height: number;
  readonly width: number;

  private constructor(cells: Uint8Array, height: number, width: number) {
    this.#cells = cells;
    this.height = height;
    this.width = width;
    // Freeze the wrapper only; freezing Uint8Array throws TypeError in V8.
    Object.freeze(this);
  }

  /** Builds a validated platform from non-empty, uniform-width cell lines. */
  static fromLines(lines: readonly string[]): DishPlatform {
    if (lines.length === 0) {
      throw new RangeError('Platform must contain at least one row');
    }
    const height = lines.length;
    const width = lines[0]!.length;
    if (width === 0) {
      throw new RangeError('Platform rows must be non-empty');
    }
    const cells = new Uint8Array(height * width);
    for (let r = 0; r < height; r += 1) {
      const row = lines[r]!;
      if (row.length !== width) {
        throw new RangeError(`Expected row ${r} length ${width}, got ${row.length}`);
      }
      const offset = r * width;
      for (let c = 0; c < width; c += 1) {
        cells[offset + c] = encodeCellChar(row.charAt(c));
      }
    }
    return new DishPlatform(cells, height, width);
  }

  #countRowRounds(row: number): number {
    const start = row * this.width;
    const end = start + this.width;
    let count = 0;
    for (let i = start; i < end; i += 1) {
      if (this.#cells[i] === CELL_ROUND) {
        count += 1;
      }
    }
    return count;
  }

  /** Total number of rounded rocks (`O`) currently on the platform. */
  get roundedCount(): number {
    let total = 0;
    for (let r = 0; r < this.height; r += 1) {
      total += this.#countRowRounds(r);
    }
    return total;
  }

  /** Per-row north-beam load values from top row (`height`) to bottom row (`1`). */
  get rowLoads(): readonly number[] {
    const loads: number[] = [];
    for (let r = 0; r < this.height; r += 1) {
      loads.push(this.#countRowRounds(r) * (this.height - r));
    }
    return Object.freeze(loads);
  }

  /** Total load on the north support beams. */
  get northLoad(): number {
    let total = 0;
    for (let r = 0; r < this.height; r += 1) {
      total += this.#countRowRounds(r) * (this.height - r);
    }
    return total;
  }

  /** Returns the character at `(row, col)`. */
  cellAt(row: number, col: number): CellChar {
    validateAxisIndex(row, this.height, 'row');
    validateAxisIndex(col, this.width, 'col');
    return String.fromCharCode(this.#cells[row * this.width + col]!) as CellChar;
  }

  /** Returns a new platform after tilting all rounded rocks in `direction`. */
  tilt(direction: TiltDirection): DishPlatform {
    return new DishPlatform(
      tiltBuffer(this.#cells, this.height, this.width, direction),
      this.height,
      this.width,
    );
  }

  /** Compact ASCII row-major fingerprint suitable for cycle-detection keys. */
  fingerprint(): string {
    return ASCII_DECODER.decode(this.#cells);
  }

  /** Returns frozen row strings representing the platform grid. */
  toLines(): readonly string[] {
    const raw = this.fingerprint();
    const rows: string[] = [];
    for (let i = 0; i < raw.length; i += this.width) {
      rows.push(raw.slice(i, i + this.width));
    }
    return Object.freeze(rows);
  }
}

/** Parses raw puzzle text into an immutable `DishPlatform`. */
export function parseDishPlatform(raw: string): DishPlatform {
  const trimmed = raw.replace(/\r\n?/g, '\n').trim();
  if (trimmed.length === 0) {
    throw new RangeError('Platform input must not be empty');
  }
  return DishPlatform.fromLines(trimmed.split('\n'));
}
