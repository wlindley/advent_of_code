import { describe, expect, it } from 'vitest';
import { findMaxPair, HomeworkSumResult, MaxPairResult, sumHomework } from './analyzer';
import { parseSnailfishHomework } from './parser';
import {
  HOMEWORK_SUM_POLICY,
  MAX_PAIR_MAGNITUDE_POLICY,
  SnailfishOperandPlan,
} from './policy';

const OFFICIAL_HOMEWORK = [
  '[[[0,[5,8]],[[1,7],[9,6]]],[[4,[1,2]],[[1,4],2]]]',
  '[[[5,[2,8]],4],[5,[[9,9],0]]]',
  '[6,[[[6,2],[5,6]],[[7,6],[4,7]]]]',
  '[[[6,[0,7]],[0,9]],[4,[9,[9,0]]]]',
  '[[[7,[6,4]],[3,[1,3]]],[[[5,5],1],9]]',
  '[[6,[[7,3],[3,2]]],[[[3,8],[5,7]],4]]',
  '[[[[5,4],[7,7]],8],[[8,3],8]]',
  '[[9,3],[[9,9],[6,[4,9]]]]',
  '[[2,[[7,7],7]],[[5,8],[[9,3],[0,2]]]]',
  '[[[[5,2],5],[8,[3,7]]],[[5,[7,5]],[4,4]]]',
].join('\n');

describe('snailfish homework analyzer', () => {
  it('sums single-line and multi-line homeworks without stored derived state', () => {
    const single = sumHomework(parseSnailfishHomework('[1,2]'));
    expect(single).toBeInstanceOf(HomeworkSumResult);
    expect(single.additionCount).toBe(0);
    expect(single.finalSum.toString()).toBe('[1,2]');
    expect(single.finalMagnitude).toBe(7);
    expect(Object.isFrozen(single)).toBe(true);

    const multi = sumHomework(parseSnailfishHomework(OFFICIAL_HOMEWORK));
    expect(multi.additionCount).toBe(9);
    expect(multi.finalSum.toString()).toBe(
      '[[[[6,6],[7,6]],[[7,7],[7,0]]],[[[7,7],[7,7]],[[7,8],[9,9]]]]',
    );
    expect(multi.finalMagnitude).toBe(4140);
  });

  it('finds max ordered pair including zero-magnitude boundary and rejects < 2 operands', () => {
    expect(() => findMaxPair(parseSnailfishHomework('[1,2]'))).toThrow(RangeError);

    const zeros = findMaxPair(parseSnailfishHomework('[0,0]\n[0,0]'));
    expect(zeros).toBeInstanceOf(MaxPairResult);
    expect(zeros.leftIndex).toBe(0);
    expect(zeros.rightIndex).toBe(1);
    expect(zeros.magnitude).toBe(0);
    expect(Object.isFrozen(zeros)).toBe(true);

    const best = findMaxPair(parseSnailfishHomework(OFFICIAL_HOMEWORK));
    expect(best.leftIndex).toBe(8);
    expect(best.rightIndex).toBe(0);
    expect(best.magnitude).toBe(3993);
    expect(best.sum.toString()).toBe(
      '[[[[7,8],[6,6]],[[6,0],[7,7]]],[[[7,8],[8,8]],[[7,9],[0,6]]]]',
    );
  });
});

describe('snailfish policies', () => {
  it('solves and plans traces for HOMEWORK_SUM_POLICY and MAX_PAIR_MAGNITUDE_POLICY', () => {
    const hw = parseSnailfishHomework(OFFICIAL_HOMEWORK);
    expect(HOMEWORK_SUM_POLICY.mode).toBe('homework-sum');
    expect(HOMEWORK_SUM_POLICY.solve(hw)).toBe(4140);
    const sumPlan = HOMEWORK_SUM_POLICY.planTrace(hw);
    expect(sumPlan.operands).toHaveLength(10);
    expect(sumPlan.description).toContain('10');

    expect(MAX_PAIR_MAGNITUDE_POLICY.mode).toBe('max-pair');
    expect(MAX_PAIR_MAGNITUDE_POLICY.solve(hw)).toBe(3993);
    const pairPlan = MAX_PAIR_MAGNITUDE_POLICY.planTrace(hw);
    expect(pairPlan.operands).toHaveLength(2);
    expect(pairPlan.description).toContain('3993');
    expect(Object.isFrozen(pairPlan)).toBe(true);
    expect(Object.isFrozen(pairPlan.operands)).toBe(true);
  });

  it('rejects empty operand plans', () => {
    expect(() => new SnailfishOperandPlan([], 'empty')).toThrow(RangeError);
  });
});
