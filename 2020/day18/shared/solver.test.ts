import { describe, expect, it } from 'vitest';
import { ADD_BEFORE_MUL_POLICY, EQUAL_PRECEDENCE_POLICY } from './policies';
import { OperationOrderSolver } from './solver';

describe('day18 shared OperationOrderSolver', () => {
  it('parses, solves, and traces with omitted and explicit trace options under both policies', () => {
    const part1 = new OperationOrderSolver(EQUAL_PRECEDENCE_POLICY);
    const part2 = new OperationOrderSolver(ADD_BEFORE_MUL_POLICY);

    expect(Object.isFrozen(part1)).toBe(true);
    const input = '1 + 2 * 3 + 4 * 5 + 6\n1 + (2 * 3) + (4 * (5 + 6))';

    const prog1 = part1.parse(input);
    expect(part1.solve(prog1)).toBe(71n + 51n);

    const fullTrace = part1.trace(prog1);
    expect(fullTrace).toHaveLength(prog1.totalSteps);
    expect(fullTrace[fullTrace.length - 1]?.cumulativeSum).toBe(122n);

    const boundedTrace = part1.trace(prog1, { maxSteps: 2 });
    expect(boundedTrace).toHaveLength(2);
    expect(boundedTrace[1]?.cumulativeSum).toBe(122n);

    const prog2 = part2.parse(input);
    expect(part2.solve(prog2)).toBe(231n + 51n);
  });
});
