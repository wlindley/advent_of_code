import { type KeepAwayRule } from '../../shared';

export const PART2_ROUNDS = 10_000;

/** Part 2 relief strategy: preserves divisibility across all monkeys via modulo LCM. */
export class ModularReliefRule implements KeepAwayRule {
  readonly rounds = PART2_ROUNDS;
  readonly reliefLabel = 'worry mod LCM';

  constructor() {
    Object.freeze(this);
  }

  relieve(worry: bigint, commonModulus: bigint): bigint {
    if (worry < 0n) {
      throw new RangeError(`Worry level must be >= 0n, got ${worry}`);
    }
    if (commonModulus <= 0n) {
      throw new RangeError(`Common modulus must be > 0n, got ${commonModulus}`);
    }
    return worry % commonModulus;
  }
}
