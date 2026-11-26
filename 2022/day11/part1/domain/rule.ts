import { floorDiv } from '../../../../shared/core';
import { type KeepAwayRule } from '../../shared';

export const PART1_ROUNDS = 20;

/** Part 1 relief strategy dividing worry by 3 with floor rounding after each inspection. */
export class DivideByThreeRule implements KeepAwayRule {
  readonly rounds = PART1_ROUNDS;
  readonly reliefLabel = 'floor(worry / 3)';

  constructor() {
    Object.freeze(this);
  }

  relieve(worry: bigint): bigint {
    return floorDiv(worry, 3n);
  }
}
