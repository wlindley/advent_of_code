/** Immutable inclusive integer interval `[start, end]` over arbitrary-precision `bigint` bounds. */
export class ClosedInterval {
  readonly start: bigint;
  readonly end: bigint;

  constructor(start: bigint, end: bigint) {
    if (start > end) {
      throw new RangeError(`Interval start (${start}) must not exceed end (${end})`);
    }
    this.start = start;
    this.end = end;
    Object.freeze(this);
  }

  get length(): bigint {
    return this.end - this.start + 1n;
  }

  contains(value: bigint): boolean {
    return value >= this.start && value <= this.end;
  }
}

/** Normalized sorted union of disjoint, non-adjacent `ClosedInterval` bands. */
export class IntervalUnion {
  readonly intervals: readonly ClosedInterval[];

  constructor(intervals: Iterable<ClosedInterval>) {
    // Compare bigints explicitly because `a - b` is a bigint and cannot be returned to Array.sort.
    const sorted = Array.from(intervals).sort((a, b) =>
      a.start < b.start ? -1 : a.start > b.start ? 1 : 0,
    );
    const merged: ClosedInterval[] = [];

    if (sorted.length > 0) {
      let curStart = sorted[0]!.start;
      let curEnd = sorted[0]!.end;

      for (let i = 1; i < sorted.length; i += 1) {
        const next = sorted[i]!;
        // Coalesce touching integer ranges (e.g. [3, 5] and [6, 7]) in addition to overlaps.
        if (next.start <= curEnd + 1n) {
          curEnd = next.end > curEnd ? next.end : curEnd;
        } else {
          merged.push(new ClosedInterval(curStart, curEnd));
          curStart = next.start;
          curEnd = next.end;
        }
      }
      merged.push(new ClosedInterval(curStart, curEnd));
    }

    this.intervals = Object.freeze(merged);
    Object.freeze(this);
  }

  get totalLength(): bigint {
    let total = 0n;
    for (const iv of this.intervals) {
      total += iv.length;
    }
    return total;
  }

  findContaining(value: bigint): ClosedInterval | undefined {
    let lo = 0;
    let hi = this.intervals.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const iv = this.intervals[mid]!;
      if (value < iv.start) {
        hi = mid - 1;
      } else if (value > iv.end) {
        lo = mid + 1;
      } else {
        return iv;
      }
    }
    return undefined;
  }

  contains(value: bigint): boolean {
    return this.findContaining(value) !== undefined;
  }
}
