import { absDiffBigInt, type FuelCostModel } from './fuelModel';

export type NonEmptyBigInts = readonly [bigint, ...bigint[]];

/** Immutable, non-empty collection of horizontal crab submarine coordinates. */
export class CrabFleet {
  readonly #positions: NonEmptyBigInts;

  constructor(positions: readonly bigint[]) {
    const [first, ...rest] = positions;
    if (first === undefined) {
      throw new RangeError('CrabFleet requires at least one position');
    }
    this.#positions = Object.freeze([first, ...rest]);
    Object.freeze(this);
  }

  get size(): number {
    return this.#positions.length;
  }

  get positions(): NonEmptyBigInts {
    return this.#positions;
  }

  get minPosition(): bigint {
    let min = this.#positions[0];
    for (const pos of this.#positions) {
      if (pos < min) min = pos;
    }
    return min;
  }

  get maxPosition(): bigint {
    let max = this.#positions[0];
    for (const pos of this.#positions) {
      if (pos > max) max = pos;
    }
    return max;
  }

  get span(): bigint {
    return this.maxPosition - this.minPosition;
  }

  fuelAt(target: bigint, model: FuelCostModel): bigint {
    let total = 0n;
    for (const pos of this.#positions) {
      total += model.costForDistance(absDiffBigInt(pos, target));
    }
    return total;
  }
}
