/** Terrain cell character in a mirror field: `.` (ash) or `#` (rock). */
export type TerrainCell = '.' | '#';

const ROW_RE = /^[.#]+$/;

function validateAxisIndex(index: number, bound: number, label: string): void {
  if (!Number.isInteger(index) || index < 0 || index >= bound) {
    throw new RangeError(`${label} index ${index} out of bounds [0, ${bound})`);
  }
}

function validatePatternRows(rows: readonly string[]): readonly string[] {
  if (rows.length === 0) {
    throw new RangeError('MirrorPattern requires at least one row');
  }
  const expectedWidth = rows[0]!.length;
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r]!;
    if (!ROW_RE.test(row)) {
      throw new RangeError(`Row ${r} contains invalid terrain characters or is empty`);
    }
    if (row.length !== expectedWidth) {
      throw new RangeError(`Row ${r} width ${row.length} does not match expected ${expectedWidth}`);
    }
  }
  return Object.freeze([...rows]);
}

/** Immutable rectangular grid of ash (`.`) and rock (`#`) cells. */
export class MirrorPattern {
  readonly rows: readonly string[];

  constructor(rows: readonly string[]) {
    this.rows = validatePatternRows(rows);
    Object.freeze(this);
  }

  get height(): number {
    return this.rows.length;
  }

  get width(): number {
    return this.rows[0]!.length;
  }

  cell(row: number, col: number): TerrainCell {
    validateAxisIndex(row, this.height, 'Row');
    validateAxisIndex(col, this.width, 'Column');
    return this.rows[row]![col] as TerrainCell;
  }

  /** Encodes each row as a BigInt bitmask with bit `c` set iff `cell(r, c) === '#'`. */
  encodeRowMasks(): readonly bigint[] {
    const masks: bigint[] = [];
    for (let r = 0; r < this.height; r += 1) {
      const row = this.rows[r]!;
      let mask = 0n;
      for (let c = 0; c < this.width; c += 1) {
        if (row[c] === '#') mask |= 1n << BigInt(c);
      }
      masks.push(mask);
    }
    return Object.freeze(masks);
  }

  /** Encodes each column as a BigInt bitmask with bit `r` set iff `cell(r, c) === '#'`. */
  encodeColMasks(): readonly bigint[] {
    const masks: bigint[] = [];
    for (let c = 0; c < this.width; c += 1) {
      let mask = 0n;
      for (let r = 0; r < this.height; r += 1) {
        if (this.rows[r]![c] === '#') mask |= 1n << BigInt(r);
      }
      masks.push(mask);
    }
    return Object.freeze(masks);
  }
}

/** Parses blank-line-delimited mirror patterns into frozen `MirrorPattern` objects. */
export function parseMirrorPatterns(raw: string): readonly MirrorPattern[] {
  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  if (normalized.length === 0) {
    throw new RangeError('Mirror patterns input must not be empty');
  }
  const blocks = normalized.split(/\n(?:[ \t]*\n)+/);
  const patterns = blocks.map((block) => {
    const lines = block.split('\n').map((line) => line.trim());
    return new MirrorPattern(lines);
  });
  return Object.freeze(patterns);
}
