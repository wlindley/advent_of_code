const BANK_PATTERN = /^[1-9]+$/;

/** Immutable, strictly increasing index selection over a BatteryBank. */
export class JoltageSelection {
  readonly bank: BatteryBank;
  readonly indices: readonly number[];

  constructor(bank: BatteryBank, indices: readonly number[]) {
    if (indices.length === 0) throw new RangeError('JoltageSelection requires at least one index');
    for (let i = 0; i < indices.length; i += 1) {
      const idx = indices[i]!;
      if (!Number.isInteger(idx) || idx < 0 || idx >= bank.length) {
        throw new RangeError(`Selection index ${idx} out of bounds [0, ${bank.length})`);
      }
      if (i > 0 && idx <= indices[i - 1]!) {
        throw new RangeError('Selection indices must be strictly increasing');
      }
    }
    this.bank = bank;
    this.indices = Object.freeze([...indices]);
    Object.freeze(this);
  }

  get count(): number { return this.indices.length; }
  get digits(): string { return this.indices.map((i) => this.bank.raw[i]!).join(''); }
  get joltage(): bigint { return BigInt(this.digits); }
}

/** Validated bank of battery cells labeled '1'..'9'. */
export class BatteryBank {
  readonly raw: string;

  constructor(raw: string) {
    if (!BANK_PATTERN.test(raw)) {
      throw new Error(`Invalid battery bank "${raw}": expected non-empty digits 1-9`);
    }
    this.raw = raw;
    Object.freeze(this);
  }

  get length(): number { return this.raw.length; }

  /**
   * Selects `count` cells in order maximizing the resulting decimal joltage,
   * breaking equal-value ties toward the earliest indices via strict `>`.
   */
  selectMaxJoltage(count: number): JoltageSelection {
    if (!Number.isInteger(count) || count < 1 || count > this.raw.length) {
      throw new RangeError(`Selection count ${count} must be an integer in [1, ${this.raw.length}]`);
    }
    const stack: number[] = [];
    let drops = this.raw.length - count;
    for (let i = 0; i < this.raw.length; i += 1) {
      const code = this.raw.charCodeAt(i);
      while (drops > 0 && stack.length > 0 && code > this.raw.charCodeAt(stack[stack.length - 1]!)) {
        stack.pop();
        drops -= 1;
      }
      stack.push(i);
    }
    return new JoltageSelection(this, stack.slice(0, count));
  }
}

export function parseBatteryBanks(raw: string): readonly BatteryBank[] {
  const trimmed = raw.trim();
  if (trimmed === '') throw new Error('Input must contain at least one battery bank');
  const banks = trimmed.split(/\r?\n/).map((line, index) => {
    try {
      return new BatteryBank(line);
    } catch (error) {
      throw new Error(`Line ${index + 1}: ${(error as Error).message}`);
    }
  });
  return Object.freeze(banks);
}
