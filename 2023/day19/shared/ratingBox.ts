import { ClosedInterval } from '../../../shared/core';
import type { PartRating } from './partRating';
import type { Category } from './types';
import type { ConditionalRule } from './workflow';

export interface RatingBoxFields {
  readonly x: ClosedInterval;
  readonly m: ClosedInterval;
  readonly a: ClosedInterval;
  readonly s: ClosedInterval;
}

export interface SplitResult {
  readonly matched: RatingBox | null;
  readonly remaining: RatingBox | null;
}

function pointInterval(value: number): ClosedInterval {
  const bound = BigInt(value);
  return new ClosedInterval(bound, bound);
}

function splitLessThan(box: RatingBox, rule: ConditionalRule): SplitResult {
  const interval = box.rangeFor(rule.category);
  const threshold = BigInt(rule.threshold);
  if (interval.end < threshold) return { matched: box, remaining: null };
  if (interval.start >= threshold) return { matched: null, remaining: box };
  return {
    matched: box.withRange(rule.category, new ClosedInterval(interval.start, threshold - 1n)),
    remaining: box.withRange(rule.category, new ClosedInterval(threshold, interval.end)),
  };
}

function splitGreaterThan(box: RatingBox, rule: ConditionalRule): SplitResult {
  const interval = box.rangeFor(rule.category);
  const threshold = BigInt(rule.threshold);
  if (interval.start > threshold) return { matched: box, remaining: null };
  if (interval.end <= threshold) return { matched: null, remaining: box };
  return {
    matched: box.withRange(rule.category, new ClosedInterval(threshold + 1n, interval.end)),
    remaining: box.withRange(rule.category, new ClosedInterval(interval.start, threshold)),
  };
}

/** Immutable 4D hyperrectangle of part rating intervals backed by `ClosedInterval`. */
export class RatingBox implements RatingBoxFields {
  readonly x: ClosedInterval;
  readonly m: ClosedInterval;
  readonly a: ClosedInterval;
  readonly s: ClosedInterval;

  constructor(fields: RatingBoxFields) {
    this.x = fields.x;
    this.m = fields.m;
    this.a = fields.a;
    this.s = fields.s;
    Object.freeze(this);
  }

  /** Builds a uniform 4D box `[min, max]^4`. */
  static uniform(min: bigint, max: bigint): RatingBox {
    const interval = new ClosedInterval(min, max);
    return new RatingBox({ x: interval, m: interval, a: interval, s: interval });
  }

  /** Builds a unit-volume 4D box representing a single `PartRating`. */
  static fromPart(part: PartRating): RatingBox {
    return new RatingBox({
      x: pointInterval(part.x),
      m: pointInterval(part.m),
      a: pointInterval(part.a),
      s: pointInterval(part.s),
    });
  }

  /** Dynamic exact BigInt Cartesian product volume of the 4 intervals. */
  get volume(): bigint {
    return this.x.length * this.m.length * this.a.length * this.s.length;
  }

  /** Returns the closed interval for the requested category. */
  rangeFor(category: Category): ClosedInterval {
    return this[category];
  }

  /** Returns a copy of this box with a single category interval replaced. */
  withRange(category: Category, range: ClosedInterval): RatingBox {
    return new RatingBox({
      x: this.x,
      m: this.m,
      a: this.a,
      s: this.s,
      [category]: range,
    });
  }

  /** Returns true when `part` falls inside all four category intervals. */
  contains(part: PartRating): boolean {
    return (
      this.x.contains(BigInt(part.x)) &&
      this.m.contains(BigInt(part.m)) &&
      this.a.contains(BigInt(part.a)) &&
      this.s.contains(BigInt(part.s))
    );
  }

  /** Partitions this box into `{ matched, remaining }` sub-boxes according to `rule`. */
  split(rule: ConditionalRule): SplitResult {
    return rule.op === '<' ? splitLessThan(this, rule) : splitGreaterThan(this, rule);
  }
}
