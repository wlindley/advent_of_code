import type { Rational } from '../../../shared/core';

function eliminatePivot(target: Rational[], pivotRow: readonly Rational[], col: number): void {
  const factor = target[col]!;
  if (factor.isZero) return;
  for (let k = 0; k < target.length; k += 1) {
    target[k] = target[k]!.sub(factor.mul(pivotRow[k]!));
  }
}

function findPivotColumn(row: readonly Rational[], numVars: number): number {
  for (let col = 0; col < numVars; col += 1) {
    if (!row[col]!.isZero) return col;
  }
  return -1;
}

function scaleRow(row: Rational[], divisor: Rational): void {
  for (let k = 0; k < row.length; k += 1) {
    row[k] = row[k]!.div(divisor);
  }
}

/** Incremental exact Gauss-Jordan RREF solver over arbitrary-precision Rationals. */
export class RationalLinearSystem {
  readonly numVars: number;
  private readonly pivots = new Map<number, Rational[]>();

  constructor(numVars: number) {
    if (!Number.isInteger(numVars) || numVars < 1) {
      throw new RangeError(`numVars must be a positive integer, got ${numVars}`);
    }
    this.numVars = numVars;
  }

  get rank(): number {
    return this.pivots.size;
  }

  get isFullRank(): boolean {
    return this.pivots.size === this.numVars;
  }

  addEquation(coefficients: readonly Rational[], rhs: Rational): boolean {
    if (coefficients.length !== this.numVars) {
      throw new RangeError(
        `Expected ${this.numVars} coefficients, got ${coefficients.length}`,
      );
    }
    const row: Rational[] = [...coefficients, rhs];
    for (const [col, pivotRow] of this.pivots) {
      eliminatePivot(row, pivotRow, col);
    }
    const pivotCol = findPivotColumn(row, this.numVars);
    if (pivotCol === -1) {
      if (!row[this.numVars]!.isZero) {
        throw new Error('Inconsistent linear system');
      }
      return false;
    }
    scaleRow(row, row[pivotCol]!);
    for (const existingRow of this.pivots.values()) {
      eliminatePivot(existingRow, row, pivotCol);
    }
    this.pivots.set(pivotCol, row);
    return true;
  }

  solve(): readonly Rational[] {
    if (!this.isFullRank) {
      throw new Error(`Linear system is underdetermined (rank ${this.rank} < ${this.numVars})`);
    }
    const solution: Rational[] = [];
    for (let col = 0; col < this.numVars; col += 1) {
      solution.push(this.pivots.get(col)![this.numVars]!);
    }
    return Object.freeze(solution);
  }
}
