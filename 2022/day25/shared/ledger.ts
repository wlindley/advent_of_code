import { encodeSnafu, SnafuNumber } from './snafu';

/** Immutable non-empty collection of SNAFU fuel ledger entries with derived totals. */
export class SnafuLedger {
  readonly entries: readonly SnafuNumber[];

  constructor(entries: readonly SnafuNumber[]) {
    if (entries.length === 0) {
      throw new RangeError('SnafuLedger requires at least one entry');
    }
    this.entries = Object.freeze([...entries]);
    Object.freeze(this);
  }

  get count(): number {
    return this.entries.length;
  }

  get maxLength(): number {
    let max = 0;
    for (let i = 0; i < this.entries.length; i += 1) {
      const len = this.entries[i]!.digitCount;
      if (len > max) max = len;
    }
    return max;
  }

  get totalDecimal(): bigint {
    let sum = 0n;
    for (let i = 0; i < this.entries.length; i += 1) {
      sum += this.entries[i]!.decimal;
    }
    return sum;
  }

  get totalSnafu(): string {
    return encodeSnafu(this.totalDecimal);
  }
}

/** Parses newline-delimited SNAFU fuel requirements into an immutable `SnafuLedger`. */
export function parseFuelLedger(raw: string): SnafuLedger {
  const lines = raw.split(/\r?\n/);
  const entries: SnafuNumber[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length > 0) {
      entries.push(new SnafuNumber(trimmed));
    }
  }
  return new SnafuLedger(entries);
}
