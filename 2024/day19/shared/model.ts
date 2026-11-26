export const STRIPE_COLORS = Object.freeze(['w', 'u', 'b', 'r', 'g'] as const);

export type StripeColor = (typeof STRIPE_COLORS)[number];

export type StripeIndex = 0 | 1 | 2 | 3 | 4;

export const STRIPE_COUNT = 5;

/** Maps a single canonical stripe character (`w/u/b/r/g`) to its dense index `[0..4]`. */
export function stripeToIndex(ch: string): StripeIndex {
  const idx = STRIPE_COLORS.indexOf(ch as StripeColor);
  if (idx === -1) {
    throw new RangeError(`Invalid stripe color "${ch}"; expected one of w, u, b, r, g`);
  }
  return idx as StripeIndex;
}

/** Validates that `value` is a non-empty string of canonical stripe colors. */
export function assertValidStripeSequence(value: string, label: string): void {
  if (value.length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }
  for (let i = 0; i < value.length; i += 1) {
    stripeToIndex(value[i]!);
  }
}

function validatePatterns(patterns: readonly string[]): readonly string[] {
  if (patterns.length === 0) {
    throw new RangeError('LinenLayout requires at least one towel pattern');
  }
  const seen = new Set<string>();
  const copy: string[] = [];
  for (const pattern of patterns) {
    assertValidStripeSequence(pattern, 'pattern');
    if (seen.has(pattern)) {
      throw new Error(`Duplicate towel pattern "${pattern}"`);
    }
    seen.add(pattern);
    copy.push(pattern);
  }
  return Object.freeze(copy);
}

function validateDesigns(designs: readonly string[]): readonly string[] {
  if (designs.length === 0) {
    throw new RangeError('LinenLayout requires at least one target design');
  }
  const copy: string[] = [];
  for (const design of designs) {
    assertValidStripeSequence(design, 'design');
    copy.push(design);
  }
  return Object.freeze(copy);
}

function maxStringLength(values: readonly string[]): number {
  let max = 0;
  for (const value of values) {
    if (value.length > max) max = value.length;
  }
  return max;
}

/** Immutable validated set of available towel patterns and target designs. */
export class LinenLayout {
  readonly patterns: readonly string[];
  readonly designs: readonly string[];

  constructor(patterns: readonly string[], designs: readonly string[]) {
    this.patterns = validatePatterns(patterns);
    this.designs = validateDesigns(designs);
    Object.freeze(this);
  }

  get patternCount(): number { return this.patterns.length; }
  get designCount(): number { return this.designs.length; }
  get maxPatternLength(): number { return maxStringLength(this.patterns); }
  get maxDesignLength(): number { return maxStringLength(this.designs); }
}

function validatePrefixWays(design: string, prefixWays: readonly bigint[]): readonly bigint[] {
  if (prefixWays.length !== design.length + 1) {
    throw new RangeError(`prefixWays length ${prefixWays.length} must equal ${design.length + 1}`);
  }
  if (prefixWays[0]! !== 1n) {
    throw new RangeError(`prefixWays[0] must be 1n, got ${prefixWays[0]}`);
  }
  const copy: bigint[] = [];
  for (const count of prefixWays) {
    if (count < 0n) {
      throw new RangeError(`prefixWays entries must be non-negative, got ${count}`);
    }
    copy.push(count);
  }
  return Object.freeze(copy);
}

function validateWitness(
  design: string,
  prefixWays: readonly bigint[],
  witness: readonly string[] | null,
): readonly string[] | null {
  const totalWays = prefixWays[design.length]!;
  if (totalWays === 0n) {
    if (witness !== null) {
      throw new RangeError('Impossible design must have a null witnessDecomposition');
    }
    return null;
  }
  if (witness === null) {
    throw new RangeError('Possible design must provide a witnessDecomposition');
  }
  for (const tile of witness) {
    if (tile.length === 0) {
      throw new RangeError('witnessDecomposition tiles must not be empty');
    }
  }
  if (witness.join('') !== design) {
    throw new RangeError('witnessDecomposition must concatenate to the exact design');
  }
  return Object.freeze(witness.slice());
}

/** Immutable DP prefix-count and optional witness decomposition for a single design. */
export class DesignAnalysis {
  readonly design: string;
  readonly prefixWays: readonly bigint[];
  readonly witnessDecomposition: readonly string[] | null;

  constructor(
    design: string,
    prefixWays: readonly bigint[],
    witnessDecomposition: readonly string[] | null,
  ) {
    assertValidStripeSequence(design, 'design');
    this.design = design;
    this.prefixWays = validatePrefixWays(design, prefixWays);
    this.witnessDecomposition = validateWitness(design, this.prefixWays, witnessDecomposition);
    Object.freeze(this);
  }

  get wayCount(): bigint { return this.prefixWays[this.design.length]!; }
  get possible(): boolean { return this.wayCount > 0n; }

  get furthestReachable(): number {
    for (let i = this.prefixWays.length - 1; i > 0; i -= 1) {
      if (this.prefixWays[i]! > 0n) return i;
    }
    return 0;
  }
}
