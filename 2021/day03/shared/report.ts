export type Bit = '0' | '1';

const BINARY_ROW_PATTERN = /^[01]+$/;

/** Immutable bit-count tally for a single column (or subset of rows). */
export class BitTally {
  readonly ones: number;
  readonly zeros: number;

  constructor(ones: number, zeros: number) {
    if (!Number.isInteger(ones) || ones < 0 || !Number.isInteger(zeros) || zeros < 0) {
      throw new RangeError(`Bit counts must be non-negative integers, got ones=${ones}, zeros=${zeros}`);
    }
    if (ones + zeros < 1) {
      throw new RangeError('BitTally must represent at least one bit');
    }
    this.ones = ones;
    this.zeros = zeros;
    Object.freeze(this);
  }

  get total(): number {
    return this.ones + this.zeros;
  }

  get onesRatio(): number {
    return this.ones / this.total;
  }
}

/** Immutable binary diagnostic report with column counting and row-subset filtering primitives. */
export class DiagnosticReport {
  readonly rows: readonly string[];

  constructor(rows: readonly string[]) {
    if (rows.length === 0) {
      throw new RangeError('Diagnostic report must contain at least one row');
    }
    const width = rows[0]!.length;
    const copied: string[] = [];
    for (const row of rows) {
      if (!BINARY_ROW_PATTERN.test(row)) {
        throw new SyntaxError(`Invalid binary diagnostic row: "${row}"`);
      }
      if (row.length !== width) {
        throw new RangeError(`Inconsistent row width: expected ${width}, got ${row.length}`);
      }
      copied.push(row);
    }
    this.rows = Object.freeze(copied);
    Object.freeze(this);
  }

  get rowCount(): number {
    return this.rows.length;
  }

  get bitWidth(): number {
    return this.rows[0]!.length;
  }

  rowAt(index: number): string {
    if (!Number.isInteger(index) || index < 0 || index >= this.rows.length) {
      throw new RangeError(`Row index out of bounds: ${index}`);
    }
    return this.rows[index]!;
  }

  valueAt(index: number): bigint {
    return BigInt('0b' + this.rowAt(index));
  }

  countBitsAtColumn(column: number, rowIndices?: readonly number[]): BitTally {
    this.assertValidColumn(column);
    if (rowIndices !== undefined) {
      return this.countSubsetAtColumn(column, rowIndices);
    }
    let ones = 0;
    for (const row of this.rows) {
      if (row[column] === '1') ones += 1;
    }
    return new BitTally(ones, this.rows.length - ones);
  }

  filterRowsByBit(column: number, bit: Bit, rowIndices: readonly number[]): readonly number[] {
    this.assertValidColumn(column);
    const matched: number[] = [];
    for (const idx of rowIndices) {
      if (this.rowAt(idx)[column] === bit) {
        matched.push(idx);
      }
    }
    return Object.freeze(matched);
  }

  private assertValidColumn(column: number): void {
    if (!Number.isInteger(column) || column < 0 || column >= this.bitWidth) {
      throw new RangeError(`Column index out of bounds: ${column}`);
    }
  }

  private countSubsetAtColumn(column: number, rowIndices: readonly number[]): BitTally {
    let ones = 0;
    for (const idx of rowIndices) {
      if (this.rowAt(idx)[column] === '1') ones += 1;
    }
    return new BitTally(ones, rowIndices.length - ones);
  }
}

/** Parses newline-delimited binary rows (ignoring blank lines) into a DiagnosticReport. */
export function parseDiagnosticReport(raw: string): DiagnosticReport {
  const rows: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      rows.push(trimmed);
    }
  }
  return new DiagnosticReport(rows);
}
