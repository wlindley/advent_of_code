import { ClosedInterval } from '../../../shared/core';

const CATEGORY_RE = /^[a-zA-Z0-9_]+$/;

/** Validates that a `bigint` domain bound or seed value is non-negative. */
export function assertNonNegativeBigInt(value: bigint, label: string): bigint {
  if (value < 0n) {
    throw new RangeError(`${label} must be >= 0n, got ${value}`);
  }
  return value;
}

function assertCategory(name: string, label: string): string {
  if (!CATEGORY_RE.test(name)) {
    throw new RangeError(`${label} must match ${CATEGORY_RE}, got "${name}"`);
  }
  return name;
}

function compareRulesBySourceStart(a: RangeRule, b: RangeRule): number {
  return a.source.start < b.source.start ? -1 : a.source.start > b.source.start ? 1 : 0;
}

/** Immutable source-to-destination linear shift rule over a contiguous `ClosedInterval`. */
export class RangeRule {
  readonly source: ClosedInterval;
  readonly destStart: bigint;

  constructor(source: ClosedInterval, destStart: bigint) {
    assertNonNegativeBigInt(source.start, 'source.start');
    assertNonNegativeBigInt(destStart, 'destStart');
    this.source = source;
    this.destStart = destStart;
    Object.freeze(this);
  }

  static fromTriple(destStart: bigint, sourceStart: bigint, length: bigint): RangeRule {
    if (length < 1n) {
      throw new RangeError(`Rule length must be >= 1n, got ${length}`);
    }
    return new RangeRule(new ClosedInterval(sourceStart, sourceStart + length - 1n), destStart);
  }

  get delta(): bigint {
    return this.destStart - this.source.start;
  }

  get destination(): ClosedInterval {
    return new ClosedInterval(this.destStart, this.destStart + this.source.length - 1n);
  }

  apply(value: bigint): bigint {
    if (!this.source.contains(value)) {
      throw new RangeError(
        `Value ${value} is outside rule source [${this.source.start}, ${this.source.end}]`,
      );
    }
    return value + this.delta;
  }
}

/** Sorted, non-overlapping piecewise-linear mapping between two adjacent almanac categories. */
export class RangeMap {
  readonly sourceCategory: string;
  readonly destCategory: string;
  readonly rules: readonly RangeRule[];

  constructor(sourceCategory: string, destCategory: string, rules: Iterable<RangeRule>) {
    this.sourceCategory = assertCategory(sourceCategory, 'sourceCategory');
    this.destCategory = assertCategory(destCategory, 'destCategory');
    const sorted = Array.from(rules);
    if (sorted.length === 0) {
      throw new RangeError(`RangeMap "${sourceCategory}-to-${destCategory}" must have at least one rule`);
    }
    sorted.sort(compareRulesBySourceStart);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1]!;
      const next = sorted[i]!;
      if (prev.source.end >= next.source.start) {
        throw new RangeError(
          `Overlapping rules in "${sourceCategory}-to-${destCategory}": [${prev.source.start}, ${prev.source.end}] and [${next.source.start}, ${next.source.end}]`,
        );
      }
    }
    this.rules = Object.freeze(sorted);
    Object.freeze(this);
  }

  findRule(value: bigint): RangeRule | undefined {
    let lo = 0;
    let hi = this.rules.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const rule = this.rules[mid]!;
      if (value < rule.source.start) hi = mid - 1;
      else if (value > rule.source.end) lo = mid + 1;
      else return rule;
    }
    return undefined;
  }

  mapValue(value: bigint): bigint {
    const rule = this.findRule(value);
    return rule !== undefined ? rule.apply(value) : value;
  }
}
