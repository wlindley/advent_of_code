/** Immutable 2D z=0,w=0 seed slice parsed from puzzle input. */
export class PocketSlice {
  readonly width: number;
  readonly height: number;
  readonly #cells: Uint8Array;

  constructor(width: number, height: number, cells: Uint8Array) {
    if (!Number.isInteger(width) || width < 1) {
      throw new RangeError(`width must be an integer >= 1, got ${width}`);
    }
    if (!Number.isInteger(height) || height < 1) {
      throw new RangeError(`height must be an integer >= 1, got ${height}`);
    }
    if (cells.length !== width * height) {
      throw new RangeError(`cells length (${cells.length}) must equal ${width * height}`);
    }
    this.width = width;
    this.height = height;
    this.#cells = new Uint8Array(cells);
    Object.freeze(this);
  }

  get activeCount(): number {
    let count = 0;
    for (const v of this.#cells) {
      count += v;
    }
    return count;
  }

  isActive(x: number, y: number): boolean {
    if (!Number.isInteger(x) || x < 0 || x >= this.width) {
      throw new RangeError(`x (${x}) out of bounds [0, ${this.width - 1}]`);
    }
    if (!Number.isInteger(y) || y < 0 || y >= this.height) {
      throw new RangeError(`y (${y}) out of bounds [0, ${this.height - 1}]`);
    }
    return this.#cells[y * this.width + x]! === 1;
  }
}

function stripOuterEmptyLines(raw: string): readonly string[] {
  const lines = raw.split(/\r?\n/);
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start]!.length === 0) start += 1;
  while (end > start && lines[end - 1]!.length === 0) end -= 1;
  if (start === end) {
    throw new Error('Pocket slice input must contain at least one non-empty row');
  }
  return lines.slice(start, end);
}

/** Parses a rectangular `#`/`.` slice, rejecting blank internal rows or unknown chars. */
export function parsePocketSlice(raw: string): PocketSlice {
  const rows = stripOuterEmptyLines(raw);
  const width = rows[0]!.length;
  const height = rows.length;
  const cells = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const row = rows[y]!;
    if (row.length !== width) {
      throw new Error(`Row ${y} has length ${row.length}, expected ${width}`);
    }
    for (let x = 0; x < width; x += 1) {
      const ch = row[x];
      if (ch === '#') {
        cells[y * width + x] = 1;
      } else if (ch !== '.') {
        throw new Error(`Unexpected character "${ch}" at (${x}, ${y})`);
      }
    }
  }
  return new PocketSlice(width, height, cells);
}
