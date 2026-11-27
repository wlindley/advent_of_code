import { addSnailfish, addSnailfishMagnitude } from './reducer';
import type { SnailfishHomework, SnailfishNumber } from './snailfish';

/** Sequential left-fold sum result for a snailfish homework list. */
export class HomeworkSumResult {
  constructor(
    readonly operandCount: number,
    readonly finalSum: SnailfishNumber,
  ) {
    Object.freeze(this);
  }

  get additionCount(): number {
    return this.operandCount - 1;
  }

  get finalMagnitude(): number {
    return this.finalSum.magnitude;
  }
}

/** Maximum ordered pair sum result across distinct homework entries. */
export class MaxPairResult {
  constructor(
    readonly leftIndex: number,
    readonly rightIndex: number,
    readonly left: SnailfishNumber,
    readonly right: SnailfishNumber,
    readonly sum: SnailfishNumber,
  ) {
    Object.freeze(this);
  }

  get magnitude(): number {
    return this.sum.magnitude;
  }
}

/** Sums all snailfish numbers in order from left to right. */
export function sumHomework(homework: SnailfishHomework): HomeworkSumResult {
  let acc = homework.numbers[0]!;
  for (let i = 1; i < homework.count; i += 1) {
    acc = addSnailfish(acc, homework.numbers[i]!);
  }
  return new HomeworkSumResult(homework.count, acc);
}

/** Finds the ordered distinct pair `(left, right)` maximizing `addSnailfish(left, right)`. */
export function findMaxPair(homework: SnailfishHomework): MaxPairResult {
  if (homework.count < 2) {
    throw new RangeError('At least two snailfish numbers are required to find a maximum pair');
  }
  let bestMag = -1;
  let bestI = 0;
  let bestJ = 1;
  for (let i = 0; i < homework.count; i += 1) {
    const left = homework.numbers[i]!;
    for (let j = 0; j < homework.count; j += 1) {
      if (i === j) continue;
      const mag = addSnailfishMagnitude(left, homework.numbers[j]!);
      if (mag > bestMag) {
        bestMag = mag;
        bestI = i;
        bestJ = j;
      }
    }
  }
  const left = homework.numbers[bestI]!;
  const right = homework.numbers[bestJ]!;
  return new MaxPairResult(bestI, bestJ, left, right, addSnailfish(left, right));
}
