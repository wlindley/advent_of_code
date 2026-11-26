import { lcmBigInt, Rational } from '../../../../shared/core';

export interface RationalEquation {
  readonly coeffs: readonly Rational[];
  readonly rhs: Rational;
}

/** Integer-scaled pivot identity: `den * x[pivotCol] = constant - sum_k freeCoeffs[k] * x[freeCols[k]]`. */
export interface IntegerPivotEquation {
  readonly pivotCol: number;
  readonly den: bigint;
  readonly constant: bigint;
  readonly freeCoeffs: readonly bigint[];
}

/** Integer-scaled objective identity: `den * sum(x) = constant + sum_k freeWeights[k] * x[freeCols[k]]`. */
export interface IntegerObjectiveForm {
  readonly den: bigint;
  readonly constant: bigint;
  readonly freeWeights: readonly bigint[];
}

function validatePivotOrder(variableCount: number, pivotOrder?: readonly number[]): readonly number[] {
  if (!pivotOrder) return Array.from({ length: variableCount }, (_, i) => i);
  if (pivotOrder.length !== variableCount) {
    throw new RangeError(`pivotOrder length (${pivotOrder.length}) must equal ${variableCount}`);
  }
  const seen = new Uint8Array(variableCount);
  for (const col of pivotOrder) {
    if (!Number.isSafeInteger(col) || col < 0 || col >= variableCount) {
      throw new RangeError(`pivotOrder column ${col} out of bounds [0, ${variableCount})`);
    }
    if (seen[col] === 1) throw new Error(`pivotOrder contains duplicate column ${col}`);
    seen[col] = 1;
  }
  return pivotOrder;
}

/** Immutable exact rational linear system reduced to full RREF over `Q`, keeping original column indices. */
export class RationalLinearSystem {
  readonly variableCount: number;
  readonly rrefRows: readonly (readonly Rational[])[];
  readonly pivotColumns: readonly number[];
  readonly freeColumns: readonly number[];
  readonly consistent: boolean;

  constructor(variableCount: number, equations: readonly RationalEquation[], pivotOrder?: readonly number[]) {
    if (!Number.isSafeInteger(variableCount) || variableCount < 0) {
      throw new RangeError(`variableCount must be a non-negative safe integer, got ${variableCount}`);
    }
    const order = validatePivotOrder(variableCount, pivotOrder);
    const rows = equations.map((eq, i) => {
      if (eq.coeffs.length !== variableCount) {
        throw new RangeError(`Equation ${i} length (${eq.coeffs.length}) must equal ${variableCount}`);
      }
      return [...eq.coeffs, eq.rhs];
    });
    const pivots: number[] = [];
    const isPivot = new Uint8Array(variableCount);
    let pivotRow = 0;
    for (const col of order) {
      if (pivotRow >= rows.length) break;
      const found = rows.findIndex((row, r) => r >= pivotRow && !row[col]!.isZero);
      if (found === -1) continue;
      if (found !== pivotRow) [rows[pivotRow], rows[found]] = [rows[found]!, rows[pivotRow]!];
      const pivotVal = rows[pivotRow]![col]!;
      const norm = rows[pivotRow]!.map((v) => v.div(pivotVal));
      rows[pivotRow] = norm;
      // Full Gauss-Jordan elimination above and below keeps each pivot row independent.
      for (let r = 0; r < rows.length; r += 1) {
        if (r === pivotRow || rows[r]![col]!.isZero) continue;
        const factor = rows[r]![col]!;
        rows[r] = rows[r]!.map((v, c) => v.sub(factor.mul(norm[c]!)));
      }
      pivots.push(col);
      isPivot[col] = 1;
      pivotRow += 1;
    }
    this.variableCount = variableCount;
    this.rrefRows = Object.freeze(rows.map((row) => Object.freeze(row)));
    this.pivotColumns = Object.freeze(pivots);
    this.freeColumns = Object.freeze(
      Array.from({ length: variableCount }, (_, c) => c).filter((c) => isPivot[c] === 0),
    );
    this.consistent = rows.slice(pivotRow).every((row) => row[variableCount]!.isZero);
    Object.freeze(this);
  }

  get equationCount(): number { return this.rrefRows.length; }
  get rank(): number { return this.pivotColumns.length; }
  get nullity(): number { return this.freeColumns.length; }

  /** Clears denominators per pivot row into exact BigInt identities. */
  toIntegerPivotEquations(): readonly IntegerPivotEquation[] {
    if (!this.consistent) throw new Error('Cannot extract pivot equations from an inconsistent system');
    return Object.freeze(
      this.pivotColumns.map((pivotCol, r) => {
        const row = this.rrefRows[r]!;
        const rhs = row[this.variableCount]!;
        let den = rhs.den;
        for (const fc of this.freeColumns) den = lcmBigInt(den, row[fc]!.den);
        const constant = rhs.num * (den / rhs.den);
        const freeCoeffs = Object.freeze(this.freeColumns.map((fc) => row[fc]!.num * (den / row[fc]!.den)));
        return Object.freeze({ pivotCol, den, constant, freeCoeffs });
      }),
    );
  }

  /** Combines all pivot equations and free variables into one common-denominator objective form. */
  toIntegerObjectiveForm(): IntegerObjectiveForm {
    if (!this.consistent) throw new Error('Cannot extract objective form from an inconsistent system');
    const pivots = this.toIntegerPivotEquations();
    let den = 1n;
    for (const p of pivots) den = lcmBigInt(den, p.den);
    let constant = 0n;
    const freeWeights = this.freeColumns.map(() => den);
    for (const p of pivots) {
      const scale = den / p.den;
      constant += p.constant * scale;
      for (let k = 0; k < this.freeColumns.length; k += 1) {
        freeWeights[k] = freeWeights[k]! - p.freeCoeffs[k]! * scale;
      }
    }
    return Object.freeze({ den, constant, freeWeights: Object.freeze(freeWeights) });
  }
}
