import { findMaxPair, sumHomework } from './analyzer';
import type { SnailfishHomework, SnailfishNumber } from './snailfish';

export type SnailfishPolicyMode = 'homework-sum' | 'max-pair';

/** Ordered operand sequence and description produced by a policy for tracing. */
export class SnailfishOperandPlan {
  readonly operands: readonly SnailfishNumber[];

  constructor(
    operands: readonly SnailfishNumber[],
    readonly description: string,
  ) {
    if (operands.length === 0) {
      throw new RangeError('Operand plan must contain at least one snailfish number');
    }
    this.operands = Object.freeze([...operands]);
    Object.freeze(this);
  }
}

/** Strategy policy selecting Part 1 sequential sum or Part 2 largest ordered pair. */
export class SnailfishPolicy {
  constructor(
    readonly mode: SnailfishPolicyMode,
    readonly label: string,
    readonly solve: (homework: SnailfishHomework) => number,
    readonly planTrace: (homework: SnailfishHomework) => SnailfishOperandPlan,
  ) {
    Object.freeze(this);
  }
}

/** Part 1 policy: sequentially add all homework lines and report final magnitude. */
export const HOMEWORK_SUM_POLICY = new SnailfishPolicy(
  'homework-sum',
  'Homework Sum Magnitude',
  (homework) => sumHomework(homework).finalMagnitude,
  (homework) =>
    new SnailfishOperandPlan(
      homework.numbers,
      `Sequential fold across ${homework.count} homework numbers`,
    ),
);

/** Part 2 policy: select the ordered pair maximizing reduced sum magnitude. */
export const MAX_PAIR_MAGNITUDE_POLICY = new SnailfishPolicy(
  'max-pair',
  'Largest Pair Magnitude',
  (homework) => findMaxPair(homework).magnitude,
  (homework) => {
    const best = findMaxPair(homework);
    return new SnailfishOperandPlan(
      [best.left, best.right],
      `Winning pair #${best.leftIndex + 1} + #${best.rightIndex + 1} (mag ${best.magnitude})`,
    );
  },
);
