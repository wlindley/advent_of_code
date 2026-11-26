export const DEFAULT_MAX_NULLITY = 24;

export interface Gf2Equation {
  readonly coeffMask: bigint;
  readonly rhs: boolean;
}

/** Counts set bits in a non-negative BigInt mask via Brian Kernighan's loop. */
export function bitCount(mask: bigint): number {
  if (mask < 0n) throw new RangeError(`bitCount requires non-negative BigInt, got ${mask}`);
  let count = 0;
  for (let m = mask; m !== 0n; m &= m - 1n) count += 1;
  return count;
}

function encodeAugmentedRows(
  variableCount: number,
  equations: readonly Gf2Equation[],
  rhsBit: bigint,
): bigint[] {
  return equations.map((eq, i) => {
    if (eq.coeffMask < 0n || eq.coeffMask >= rhsBit) {
      throw new RangeError(`Equation ${i} coeffMask out of range for ${variableCount} variables`);
    }
    return eq.rhs ? eq.coeffMask | rhsBit : eq.coeffMask;
  });
}

function reduceToRref(
  rows: bigint[],
  variableCount: number,
): { pivots: number[]; isPivot: Uint8Array; pivotRow: number } {
  const pivots: number[] = [];
  const isPivot = new Uint8Array(variableCount);
  let pivotRow = 0;
  for (let col = 0; col < variableCount && pivotRow < rows.length; col += 1) {
    const colBit = 1n << BigInt(col);
    const found = rows.findIndex((row, r) => r >= pivotRow && (row & colBit) !== 0n);
    if (found === -1) continue;
    if (found !== pivotRow) [rows[pivotRow], rows[found]] = [rows[found]!, rows[pivotRow]!];
    const pivotVal = rows[pivotRow]!;
    // Full Gauss-Jordan elimination (both above and below) keeps back-substitution trivial.
    for (let r = 0; r < rows.length; r += 1) {
      if (r !== pivotRow && (rows[r]! & colBit) !== 0n) rows[r] = rows[r]! ^ pivotVal;
    }
    pivots.push(col);
    isPivot[col] = 1;
    pivotRow += 1;
  }
  return { pivots, isPivot, pivotRow };
}

function extractParticular(rows: readonly bigint[], pivots: readonly number[], rhsBit: bigint): bigint {
  let particular = 0n;
  for (let i = 0; i < pivots.length; i += 1) {
    if ((rows[i]! & rhsBit) !== 0n) particular |= 1n << BigInt(pivots[i]!);
  }
  return particular;
}

function extractNullspaceBasis(
  rows: readonly bigint[],
  pivots: readonly number[],
  isPivot: Uint8Array,
  variableCount: number,
): bigint[] {
  const basis: bigint[] = [];
  for (let f = 0; f < variableCount; f += 1) {
    if (isPivot[f] === 1) continue;
    let vec = 1n << BigInt(f);
    for (let i = 0; i < pivots.length; i += 1) {
      if ((rows[i]! & (1n << BigInt(f))) !== 0n) vec |= 1n << BigInt(pivots[i]!);
    }
    basis.push(vec);
  }
  return basis;
}

/**
 * Immutable GF(2) linear system solved to full Reduced Row Echelon Form (RREF).
 * Bit `c` of each RREF row stores variable `c`; bit `variableCount` stores RHS.
 */
export class Gf2LinearSystem {
  readonly variableCount: number;
  readonly rrefRows: readonly bigint[];
  readonly pivotColumns: readonly number[];
  readonly particular: bigint | null;
  readonly nullspaceBasis: readonly bigint[];

  constructor(variableCount: number, equations: readonly Gf2Equation[]) {
    if (!Number.isSafeInteger(variableCount) || variableCount < 0) {
      throw new RangeError(`variableCount must be a non-negative safe integer, got ${variableCount}`);
    }
    const rhsBit = 1n << BigInt(variableCount);
    const rows = encodeAugmentedRows(variableCount, equations, rhsBit);
    const { pivots, isPivot, pivotRow } = reduceToRref(rows, variableCount);
    const consistent = rows.slice(pivotRow).every((row) => (row & rhsBit) === 0n);

    this.variableCount = variableCount;
    this.rrefRows = Object.freeze(rows);
    this.pivotColumns = Object.freeze(pivots);
    this.particular = consistent ? extractParticular(rows, pivots, rhsBit) : null;
    this.nullspaceBasis = Object.freeze(extractNullspaceBasis(rows, pivots, isPivot, variableCount));
    Object.freeze(this);
  }

  get equationCount(): number { return this.rrefRows.length; }
  get rank(): number { return this.pivotColumns.length; }
  get nullity(): number { return this.nullspaceBasis.length; }
  get consistent(): boolean { return this.particular !== null; }

  /** Finds the minimum-Hamming-weight solution via Gray-code enumeration of the nullspace. */
  minWeightSolution(maxNullity = DEFAULT_MAX_NULLITY): bigint | null {
    if (!Number.isSafeInteger(maxNullity) || maxNullity < 0 || maxNullity > 30) {
      throw new RangeError(`maxNullity must be an integer in [0, 30], got ${maxNullity}`);
    }
    if (this.particular === null) return null;
    if (this.nullity > maxNullity) {
      throw new RangeError(`Nullity ${this.nullity} exceeds maxNullity ${maxNullity}`);
    }
    let current = this.particular;
    let best = current;
    let bestWeight = bitCount(current);
    const total = 1 << this.nullity;
    for (let step = 1; step < total; step += 1) {
      current ^= this.nullspaceBasis[31 - Math.clz32(step & -step)]!;
      const w = bitCount(current);
      if (w < bestWeight || (w === bestWeight && current < best)) {
        best = current;
        bestWeight = w;
      }
    }
    return best;
  }
}
