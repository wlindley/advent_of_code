import {
  type QuadrantCounts,
  type Robot,
  type TorusSpace,
  assertNonNegativeSafeInt,
} from './model';
import {
  countAdjacentOccupied,
  countOccupancyQuadrants,
  fillOccupancy,
  safetyFactorOf,
} from './simulation';

export interface RedoubtSnapshotInit {
  readonly space: TorusSpace;
  readonly second: number;
  readonly occupancy: Uint32Array;
  readonly highlight?: boolean;
  readonly label?: string | null;
}

export interface SnapshotOptions {
  readonly highlight?: boolean;
  readonly label?: string | null;
}

/** Immutable occupancy snapshot at a single simulation second with dynamic summary getters. */
export class RedoubtSnapshot {
  readonly #occupancy: Uint32Array;
  readonly space: TorusSpace;
  readonly second: number;
  readonly highlight: boolean;
  readonly label: string | null;

  constructor(init: RedoubtSnapshotInit) {
    assertNonNegativeSafeInt(init.second, 'second');
    if (init.occupancy.length !== init.space.area) {
      throw new RangeError(
        `occupancy length ${init.occupancy.length} does not match space area ${init.space.area}`,
      );
    }
    // Copy into an isolated TypedArray buffer (TypedArrays throw TypeError if frozen in V8).
    this.#occupancy = new Uint32Array(init.occupancy);
    this.space = init.space;
    this.second = init.second;
    this.highlight = init.highlight ?? false;
    this.label = init.label ?? null;
    Object.freeze(this);
  }

  densityAt(x: number, y: number): number {
    return this.#occupancy[this.space.cellIndex(x, y)]!;
  }

  get totalRobots(): number {
    let total = 0;
    for (const count of this.#occupancy) total += count;
    return total;
  }

  get maxDensity(): number {
    let peak = 0;
    for (const count of this.#occupancy) {
      if (count > peak) peak = count;
    }
    return peak;
  }

  get uniqueCells(): number {
    let cells = 0;
    for (const count of this.#occupancy) {
      if (count > 0) cells += 1;
    }
    return cells;
  }

  get quadrants(): QuadrantCounts {
    return countOccupancyQuadrants(this.#occupancy, this.space);
  }

  get safetyFactor(): number {
    return safetyFactorOf(this.quadrants);
  }

  get adjacentPairs(): number {
    return countAdjacentOccupied(this.#occupancy, this.space);
  }
}

/** Evaluates `robots` in `space` at `second` and packages the occupancy into a `RedoubtSnapshot`. */
export function buildRedoubtSnapshot(
  robots: readonly Robot[],
  space: TorusSpace,
  second: number,
  options?: SnapshotOptions,
): RedoubtSnapshot {
  const occupancy = fillOccupancy(robots, space, second);
  return new RedoubtSnapshot({
    space,
    second,
    occupancy,
    highlight: options?.highlight,
    label: options?.label,
  });
}
