import { describe, expect, it } from 'vitest';
import { parseSnailfishNumber } from './parser';
import {
  addSnailfish,
  addSnailfishMagnitude,
  combineUnreduced,
  reduceSnailfish,
  ReductionStep,
  stepReduceSnailfish,
} from './reducer';

describe('snailfish reducer steps', () => {
  it('explodes leftmost depth >= 5 pairs across left, right, and middle positions', () => {
    const cases: readonly [string, string, number][] = [
      ['[[[[[9,8],1],2],3],4]', '[[[[0,9],2],3],4]', 0],
      ['[7,[6,[5,[4,[3,2]]]]]', '[7,[6,[5,[7,0]]]]', 4],
      ['[[6,[5,[4,[3,2]]]],1]', '[[6,[5,[7,0]]],3]', 3],
      ['[[3,[2,[1,[7,3]]]],[6,[5,[4,[3,2]]]]]', '[[3,[2,[8,0]]],[9,[5,[4,[3,2]]]]]', 3],
      ['[[3,[2,[8,0]]],[9,[5,[4,[3,2]]]]]', '[[3,[2,[8,0]]],[9,[5,[7,0]]]]', 7],
      ['[[[[[1,[2,3]],4],5],6],7]', '[[[[[3,0],7],5],6],7]', 1],
    ];
    for (const [input, expected, focusIndex] of cases) {
      const step = stepReduceSnailfish(parseSnailfishNumber(input));
      expect(step).toBeInstanceOf(ReductionStep);
      expect(step!.kind).toBe('explode');
      expect(step!.focusIndex).toBe(focusIndex);
      expect(step!.result.toString()).toBe(expected);
      expect(Object.isFrozen(step)).toBe(true);
    }
  });

  it('splits numbers >= 10 with floor/ceil and prioritizes explode over split', () => {
    const evenSplit = stepReduceSnailfish(parseSnailfishNumber('[10,1]'));
    expect(evenSplit!.kind).toBe('split');
    expect(evenSplit!.focusIndex).toBe(0);
    expect(evenSplit!.result.toString()).toBe('[[5,5],1]');

    const oddSplit = stepReduceSnailfish(parseSnailfishNumber('[1,11]'));
    expect(oddSplit!.kind).toBe('split');
    expect(oddSplit!.focusIndex).toBe(1);
    expect(oddSplit!.result.toString()).toBe('[1,[5,6]]');

    const explodeFirst = stepReduceSnailfish(parseSnailfishNumber('[[[[[9,8],1],2],3],12]'));
    expect(explodeFirst!.kind).toBe('explode');
    expect(explodeFirst!.result.toString()).toBe('[[[[0,9],2],3],12]');

    expect(stepReduceSnailfish(parseSnailfishNumber('[[1,2],[3,4]]'))).toBeNull();
  });

  it('combines, reduces, and adds without mutating source operands', () => {
    const a = parseSnailfishNumber('[[[[4,3],4],4],[7,[[8,4],9]]]');
    const b = parseSnailfishNumber('[1,1]');
    const combined = combineUnreduced(a, b);
    expect(combined.toString()).toBe('[[[[[4,3],4],4],[7,[[8,4],9]]],[1,1]]');

    const reduced = reduceSnailfish(combined);
    expect(reduced.toString()).toBe('[[[[0,7],4],[[7,8],[6,0]]],[8,1]]');
    expect(addSnailfish(a, b).toString()).toBe('[[[[0,7],4],[[7,8],[6,0]]],[8,1]]');
    expect(addSnailfishMagnitude(a, b)).toBe(1384);
    expect(a.toString()).toBe('[[[[4,3],4],4],[7,[[8,4],9]]]');
    expect(b.toString()).toBe('[1,1]');
  });
});
