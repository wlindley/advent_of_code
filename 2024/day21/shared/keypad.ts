import { type DirectionalKey, GridCoord, type NumericKey } from './model';

function validateLayoutDimensions<K extends string>(
  layout: readonly (readonly (K | null)[])[],
  gap: GridCoord,
): { readonly rows: number; readonly cols: number } {
  const rows = layout.length;
  if (rows < 1 || layout[0]!.length < 1) {
    throw new RangeError('Keypad layout must have at least 1 row and 1 column');
  }
  const cols = layout[0]!.length;
  for (const row of layout) {
    if (row.length !== cols) {
      throw new RangeError('Keypad layout rows must all have equal length');
    }
  }
  const isCornerRow = gap.row === 0 || gap.row === rows - 1;
  const isCornerCol = gap.col === 0 || gap.col === cols - 1;
  if (!isCornerRow || !isCornerCol) {
    throw new RangeError(`Keypad gap must be at a grid corner, got (${gap.row}, ${gap.col})`);
  }
  if (layout[gap.row]![gap.col] !== null) {
    throw new RangeError('Keypad layout must have null at the gap coordinate');
  }
  return { rows, cols };
}

function indexKeypadKeys<K extends string>(
  layout: readonly (readonly (K | null)[])[],
  gap: GridCoord,
): Map<K, GridCoord> {
  const positions = new Map<K, GridCoord>();
  for (let r = 0; r < layout.length; r += 1) {
    const row = layout[r]!;
    for (let c = 0; c < row.length; c += 1) {
      if (r === gap.row && c === gap.col) continue;
      const cell = row[c]!;
      if (cell === null) {
        throw new RangeError(`Unexpected null cell at (${r}, ${c})`);
      }
      if (positions.has(cell)) {
        throw new RangeError(`Duplicate keypad key: ${cell}`);
      }
      positions.set(cell, new GridCoord(r, c));
    }
  }
  return positions;
}

/** Immutable keypad layout with corner-gap invariant and gap-avoiding candidate paths. */
export class Keypad<K extends string> {
  readonly rows: number;
  readonly cols: number;
  readonly gap: GridCoord;
  readonly startKey: K;
  readonly #grid: readonly (readonly (K | null)[])[];
  readonly #positions: ReadonlyMap<K, GridCoord>;

  constructor(layout: readonly (readonly (K | null)[])[], gap: GridCoord, startKey: K) {
    const { rows, cols } = validateLayoutDimensions(layout, gap);
    const positions = indexKeypadKeys(layout, gap);
    if (!positions.has(startKey)) {
      throw new RangeError(`startKey "${startKey}" not found in keypad layout`);
    }
    this.rows = rows;
    this.cols = cols;
    this.gap = gap;
    this.startKey = startKey;
    this.#grid = Object.freeze(layout.map((row) => Object.freeze([...row])));
    this.#positions = positions;
    Object.freeze(this);
  }

  positionOf(key: K): GridCoord {
    const coord = this.#positions.get(key);
    if (!coord) {
      throw new RangeError(`Unknown keypad key: "${key}"`);
    }
    return coord;
  }

  isGapOrOutside(coord: GridCoord): boolean {
    return (
      coord.row < 0 ||
      coord.row >= this.rows ||
      coord.col < 0 ||
      coord.col >= this.cols ||
      coord.equals(this.gap)
    );
  }

  keyAt(coord: GridCoord): K | null {
    if (this.isGapOrOutside(coord)) {
      return null;
    }
    return this.#grid[coord.row]![coord.col]!;
  }

  candidatePaths(from: K, to: K): readonly string[] {
    const a = this.positionOf(from);
    const b = this.positionOf(to);
    const dr = b.row - a.row;
    const dc = b.col - a.col;
    const vert = (dr < 0 ? '^' : 'v').repeat(Math.abs(dr));
    const horiz = (dc < 0 ? '<' : '>').repeat(Math.abs(dc));
    if (dr === 0 || dc === 0) {
      return Object.freeze([`${horiz}${vert}A`]);
    }
    const paths: string[] = [];
    if (!(a.row === this.gap.row && b.col === this.gap.col)) {
      paths.push(`${horiz}${vert}A`);
    }
    if (!(b.row === this.gap.row && a.col === this.gap.col)) {
      paths.push(`${vert}${horiz}A`);
    }
    return Object.freeze(paths);
  }
}

export const NUMERIC_KEYPAD: Keypad<NumericKey> = new Keypad<NumericKey>(
  [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    [null, '0', 'A'],
  ],
  new GridCoord(3, 0),
  'A',
);

export const DIRECTIONAL_KEYPAD: Keypad<DirectionalKey> = new Keypad<DirectionalKey>(
  [
    [null, '^', 'A'],
    ['<', 'v', '>'],
  ],
  new GridCoord(0, 0),
  'A',
);
