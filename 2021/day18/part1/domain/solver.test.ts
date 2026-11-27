import { describe, expect, it } from 'vitest';
import { HOMEWORK_SUM_POLICY } from '../../shared';
import { solver } from './index';

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

describe('2021 Day 18 Part 1 solver', () => {
  it('solves official Part 1 examples using HOMEWORK_SUM_POLICY', () => {
    expect(solver.policy).toBe(HOMEWORK_SUM_POLICY);
    const cases: readonly [string, number][] = [
      ['[1,1]\n[2,2]\n[3,3]\n[4,4]', 445],
      ['[1,1]\n[2,2]\n[3,3]\n[4,4]\n[5,5]', 791],
      ['[1,1]\n[2,2]\n[3,3]\n[4,4]\n[5,5]\n[6,6]', 1137],
      [OFFICIAL_HOMEWORK, 4140],
    ];
    for (const [raw, expected] of cases) {
      const hw = solver.parse(raw);
      const answer = solver.solve(hw);
      expect(answer).toBe(expected);
      expect(solver.formatAnswer(answer)).toBe(String(expected));
    }
  });

  it('produces bounded trace frames ending at magnitude 4140', () => {
    const hw = solver.parse(OFFICIAL_HOMEWORK);
    const frames = solver.trace(hw, { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]!.kind).toBe('initial');
    expect(frames[9]!.magnitude).toBe(4140);
    expect(frames[9]!.isComplete).toBe(true);
  });
});
