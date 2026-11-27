function validatePositiveInt(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive integer, got ${value}`);
  }
  return value;
}

function validateGridCoord(row: number, col: number, rows: number, cols: number): number {
  if (!Number.isInteger(row) || row < 0 || row >= rows) {
    throw new RangeError(`row ${row} out of bounds [0, ${rows})`);
  }
  if (!Number.isInteger(col) || col < 0 || col >= cols) {
    throw new RangeError(`col ${col} out of bounds [0, ${cols})`);
  }
  return row * cols + col;
}

/** Wraps a base risk level (1..9) across `tileOffset` adjacent tiles into 1..9. */
export function wrapRisk(baseRisk: number, tileOffset: number): number {
  if (!Number.isInteger(baseRisk) || baseRisk < 1 || baseRisk > 9) {
    throw new RangeError(`baseRisk must be an integer in 1..9, got ${baseRisk}`);
  }
  if (!Number.isInteger(tileOffset) || tileOffset < 0) {
    throw new RangeError(`tileOffset must be a non-negative integer, got ${tileOffset}`);
  }
  return ((baseRisk - 1 + tileOffset) % 9) + 1;
}

/** Validates grid dimensions and cell risks (1..9), returning a defensive Uint8Array copy. */
export function validateRiskCells(
  rows: number,
  cols: number,
  cells: ArrayLike<number>,
): Uint8Array {
  const validRows = validatePositiveInt(rows, 'rows');
  const validCols = validatePositiveInt(cols, 'cols');
  const expected = validRows * validCols;
  if (cells.length !== expected) {
    throw new RangeError(`Expected ${expected} cells for ${validRows}x${validCols}, got ${cells.length}`);
  }
  const copy = new Uint8Array(expected);
  for (let i = 0; i < expected; i += 1) {
    const value = cells[i]!;
    if (!Number.isInteger(value) || value < 1 || value > 9) {
      throw new RangeError(`Cell ${i} risk must be an integer in 1..9, got ${value}`);
    }
    copy[i] = value;
  }
  return copy;
}

/** Immutable cavern tiling policy parameterizing Part 1 (1x) and Part 2 (5x). */
export class CavernPolicy {
  readonly tileFactor: number;

  constructor(tileFactor: number) {
    this.tileFactor = validatePositiveInt(tileFactor, 'tileFactor');
    Object.freeze(this);
  }
}

export const PART1_POLICY = new CavernPolicy(1);
export const PART2_POLICY = new CavernPolicy(5);

/** Immutable expanded cavern risk map ready for shortest-path search. */
export class CavernMap {
  readonly rows: number;
  readonly cols: number;
  readonly tileFactor: number;
  private readonly risks: Uint8Array;

  constructor(rows: number, cols: number, tileFactor: number, cells: ArrayLike<number>) {
    this.tileFactor = validatePositiveInt(tileFactor, 'tileFactor');
    this.risks = validateRiskCells(rows, cols, cells);
    this.rows = rows;
    this.cols = cols;
    Object.freeze(this);
  }

  get cellCount(): number {
    return this.rows * this.cols;
  }

  get startIndex(): number {
    return 0;
  }

  get goalIndex(): number {
    return this.cellCount - 1;
  }

  get riskLevels(): ArrayLike<number> {
    return this.risks;
  }

  indexOf(row: number, col: number): number {
    return validateGridCoord(row, col, this.rows, this.cols);
  }

  riskAt(row: number, col: number): number {
    return this.risks[this.indexOf(row, col)]!;
  }
}

/** Immutable parsed base cavern risk grid before tile expansion. */
export class RiskGrid {
  readonly rows: number;
  readonly cols: number;
  private readonly risks: Uint8Array;

  constructor(rows: number, cols: number, cells: ArrayLike<number>) {
    this.risks = validateRiskCells(rows, cols, cells);
    this.rows = rows;
    this.cols = cols;
    Object.freeze(this);
  }

  get cellCount(): number {
    return this.rows * this.cols;
  }

  riskAt(row: number, col: number): number {
    return this.risks[validateGridCoord(row, col, this.rows, this.cols)]!;
  }

  expand(policy: CavernPolicy): CavernMap {
    const f = policy.tileFactor;
    const outRows = this.rows * f;
    const outCols = this.cols * f;
    const expanded = new Uint8Array(outRows * outCols);
    for (let tr = 0; tr < f; tr += 1) {
      for (let r = 0; r < this.rows; r += 1) {
        const rowOffset = (tr * this.rows + r) * outCols;
        const srcOffset = r * this.cols;
        for (let tc = 0; tc < f; tc += 1) {
          const tileDist = tr + tc;
          const colOffset = rowOffset + tc * this.cols;
          for (let c = 0; c < this.cols; c += 1) {
            expanded[colOffset + c] = wrapRisk(this.risks[srcOffset + c]!, tileDist);
          }
        }
      }
    }
    return new CavernMap(outRows, outCols, f, expanded);
  }
}
