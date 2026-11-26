/** Number of internal timer cohorts (0 through 8 days). */
export const COHORT_COUNT = 9;

export type TimerBucket = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const TIMER_BUCKETS: readonly TimerBucket[] = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8]);

export type CohortTuple = readonly [
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
];

/** Validates that `days` is a non-negative safe integer. */
export function validateSimulationDays(days: number): number {
  if (!Number.isSafeInteger(days) || days < 0) {
    throw new RangeError(`days must be a non-negative safe integer, got ${days}`);
  }
  return days;
}

function freezeCohortTuple(counts: CohortTuple): CohortTuple {
  for (const count of counts) {
    if (count < 0n) {
      throw new RangeError(`Cohort count must be non-negative, got ${count}`);
    }
  }
  return Object.freeze([
    counts[0],
    counts[1],
    counts[2],
    counts[3],
    counts[4],
    counts[5],
    counts[6],
    counts[7],
    counts[8],
  ] as const);
}

/** Immutable histogram of lanternfish grouped by internal reproduction timer (0..8). */
export class LanternfishSchool {
  private readonly _counts: CohortTuple;

  constructor(counts: CohortTuple) {
    this._counts = freezeCohortTuple(counts);
    Object.freeze(this);
  }

  static fromTimers(timers: readonly TimerBucket[]): LanternfishSchool {
    const buckets: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [
      0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
    ];
    for (const timer of timers) {
      buckets[timer] += 1n;
    }
    return new LanternfishSchool(buckets);
  }

  get counts(): CohortTuple {
    return this._counts;
  }

  get totalPopulation(): bigint {
    let total = 0n;
    for (const count of this._counts) {
      total += count;
    }
    return total;
  }

  get spawningCount(): bigint {
    return this._counts[0];
  }

  get newbornCount(): bigint {
    return this._counts[8];
  }

  get maxCohortCount(): bigint {
    let max = 0n;
    for (const count of this._counts) {
      if (count > max) max = count;
    }
    return max;
  }

  countAt(timer: TimerBucket): bigint {
    return this._counts[timer];
  }

  /** Advances the entire cohort histogram by `days` simulation steps in O(days) time. */
  advance(days: number): LanternfishSchool {
    const stepCount = validateSimulationDays(days);
    if (stepCount === 0) return this;

    let [c0, c1, c2, c3, c4, c5, c6, c7, c8] = this._counts;
    for (let d = 0; d < stepCount; d += 1) {
      const spawning = c0;
      c0 = c1;
      c1 = c2;
      c2 = c3;
      c3 = c4;
      c4 = c5;
      c5 = c6;
      c6 = c7 + spawning;
      c7 = c8;
      c8 = spawning;
    }
    return new LanternfishSchool([c0, c1, c2, c3, c4, c5, c6, c7, c8]);
  }
}
