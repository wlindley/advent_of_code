import { ClosedInterval } from '../../../shared/core';
import { bigintIsqrt } from './math';

/** Immutable single boat race parameterized by total duration and record distance. */
export class BoatRace {
  readonly time: bigint;
  readonly recordDistance: bigint;

  constructor(time: bigint, recordDistance: bigint) {
    if (time < 0n) {
      throw new RangeError(`Race time must be non-negative, got ${time}`);
    }
    if (recordDistance < 0n) {
      throw new RangeError(`Record distance must be non-negative, got ${recordDistance}`);
    }
    this.time = time;
    this.recordDistance = recordDistance;
    Object.freeze(this);
  }

  distanceForHold(holdTime: bigint): bigint {
    if (holdTime < 0n || holdTime > this.time) {
      throw new RangeError(`Hold time ${holdTime} must be in [0, ${this.time}]`);
    }
    return holdTime * (this.time - holdTime);
  }

  beatsRecord(holdTime: bigint): boolean {
    return this.distanceForHold(holdTime) > this.recordDistance;
  }

  get shiftedDiscriminant(): bigint {
    // Strictly beating D is equivalent to h(T - h) >= D + 1, i.e., h^2 - T*h + (D + 1) <= 0.
    return this.time * this.time - 4n * (this.recordDistance + 1n);
  }

  get peakHold(): bigint {
    return this.time >> 1n;
  }

  get maxDistance(): bigint {
    return this.distanceForHold(this.peakHold);
  }

  get winningRange(): ClosedInterval | undefined {
    const disc = this.shiftedDiscriminant;
    if (disc < 0n) return undefined;
    const s = bigintIsqrt(disc);
    // floor((T + sqrt(disc)) / 2) equals floor((T + floor(sqrt(disc))) / 2) for all integers T.
    const hMax = (this.time + s) >> 1n;
    const hMin = this.time - hMax;
    return new ClosedInterval(hMin, hMax);
  }

  get waysToWin(): bigint {
    const range = this.winningRange;
    return range === undefined ? 0n : range.length;
  }
}

/** Non-empty immutable sheet of boat races whose error margin is the product of winning counts. */
export class RaceSheet {
  readonly races: readonly BoatRace[];

  constructor(races: Iterable<BoatRace>) {
    const list = Array.from(races);
    if (list.length === 0) {
      throw new RangeError('RaceSheet requires at least one BoatRace');
    }
    this.races = Object.freeze(list);
    Object.freeze(this);
  }

  get errorMargin(): bigint {
    let product = 1n;
    for (const race of this.races) {
      product *= race.waysToWin;
    }
    return product;
  }
}
