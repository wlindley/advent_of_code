import { describe, expect, it } from 'vitest';
import { HOMEWORK_SUM_POLICY, MAX_PAIR_MAGNITUDE_POLICY } from './policy';
import { SnailfishSolver } from './solver';

const SAMPLE_INPUT = [
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

describe('SnailfishSolver', () => {
  it('parses, solves, traces, and formats answers for HOMEWORK_SUM_POLICY', () => {
    const solver = new SnailfishSolver(HOMEWORK_SUM_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);
    const hw = solver.parse(SAMPLE_INPUT);
    const answer = solver.solve(hw);
    expect(answer).toBe(4140);
    expect(solver.formatAnswer(answer)).toBe('4140');

    const trace = solver.trace(hw, { maxSteps: 12 });
    expect(trace).toHaveLength(12);
    expect(trace[11]!.magnitude).toBe(4140);
    expect(trace[11]!.isComplete).toBe(true);
  });

  it('solves and traces using MAX_PAIR_MAGNITUDE_POLICY with default trace options', () => {
    const solver = new SnailfishSolver(MAX_PAIR_MAGNITUDE_POLICY);
    const hw = solver.parse(SAMPLE_INPUT);
    expect(solver.solve(hw)).toBe(3993);

    const trace = solver.trace(hw);
    expect(trace.length).toBeGreaterThan(0);
    expect(trace[trace.length - 1]!.magnitude).toBe(3993);
  });
});
