import { describe, expect, it } from 'vitest';
import { ENCRYPTION_WEAKNESS_POLICY, FIRST_INVALID_POLICY } from './policy';
import { XmasAttackSolver } from './solver';

const OFFICIAL_RAW = [
  35, 20, 15, 25, 47, 40, 62, 55, 65, 95,
  102, 117, 150, 182, 127, 219, 299, 277, 309, 576,
].join('\n');

describe('XmasAttackSolver', () => {
  it('validates preambleLength and freezes instance', () => {
    expect(() => new XmasAttackSolver(FIRST_INVALID_POLICY, 1)).toThrow(RangeError);
    const solver = new XmasAttackSolver(FIRST_INVALID_POLICY, 5);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.policy).toBe(FIRST_INVALID_POLICY);
    expect(solver.preambleLength).toBe(5);
  });

  it('parses, solves, and traces with default and custom maxSteps', () => {
    const part1 = new XmasAttackSolver(FIRST_INVALID_POLICY, 5);
    const stream = part1.parse(OFFICIAL_RAW);
    expect(part1.solve(stream)).toBe(127n);
    expect(part1.trace(stream)).toHaveLength(10);
    expect(part1.trace(stream, { maxSteps: 4 })).toHaveLength(4);
    expect(() => part1.trace(stream, { maxSteps: 0 })).toThrow(RangeError);

    const part2 = new XmasAttackSolver(ENCRYPTION_WEAKNESS_POLICY, 5);
    expect(part2.solve(stream)).toBe(62n);
    expect(part2.trace(stream, { maxSteps: 6 })).toHaveLength(6);
  });
});
