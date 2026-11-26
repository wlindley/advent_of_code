/** Maximum match count whose doubling point value `2^(k - 1)` fits in IEEE-754 safe integers. */
export const MAX_SAFE_MATCH_COUNT = 53;

/** Validates that `id` is a positive safe integer (>= 1). */
export function assertCardId(id: number): number {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new RangeError(`Card id must be a positive safe integer, got ${id}`);
  }
  return id;
}

/** Validates a non-empty list of non-negative safe integers and returns a frozen copy. */
export function assertNumberList(values: readonly number[], label: string): readonly number[] {
  if (values.length === 0) {
    throw new RangeError(`${label} must be non-empty`);
  }
  for (const value of values) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`${label} values must be non-negative safe integers, got ${value}`);
    }
  }
  return Object.freeze(values.slice());
}

/** Immutable value object representing one AoC 2023 Day 4 scratchcard. */
export class Scratchcard {
  readonly id: number;
  readonly winningNumbers: readonly number[];
  readonly ownedNumbers: readonly number[];

  constructor(id: number, winningNumbers: readonly number[], ownedNumbers: readonly number[]) {
    this.id = assertCardId(id);
    this.winningNumbers = assertNumberList(winningNumbers, 'winningNumbers');
    this.ownedNumbers = assertNumberList(ownedNumbers, 'ownedNumbers');
    Object.freeze(this);
  }

  /** Matched owned numbers in owned-list order (frozen). */
  get matchingNumbers(): readonly number[] {
    const winners = new Set(this.winningNumbers);
    return Object.freeze(this.ownedNumbers.filter((n) => winners.has(n)));
  }

  /** Number of owned numbers present in the winning set. */
  get matchCount(): number {
    return this.matchingNumbers.length;
  }

  /** Part 1 doubling score: 0 for 0 matches, otherwise `2^(k - 1)` up to `k = 53`. */
  get points(): number {
    const k = this.matchCount;
    if (k === 0) return 0;
    if (k > MAX_SAFE_MATCH_COUNT) {
      throw new RangeError(`Match count ${k} exceeds MAX_SAFE_MATCH_COUNT (${MAX_SAFE_MATCH_COUNT})`);
    }
    return 2 ** (k - 1);
  }
}
