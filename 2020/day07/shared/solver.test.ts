import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { ANCESTOR_COLORS_POLICY, NESTED_BAG_COUNT_POLICY } from './policy';
import { HaversackSolver } from './solver';

const SAMPLE = [
  'light red bags contain 1 bright white bag.',
  'bright white bags contain 1 shiny gold bag.',
  'shiny gold bags contain 2 dark olive bags.',
  'dark olive bags contain no other bags.',
].join('\n');

describe('HaversackSolver', () => {
  it('validates targetColor and freezes solver instance', () => {
    expect(() => new HaversackSolver(ANCESTOR_COLORS_POLICY, 'BAD')).toThrow(RangeError);
    const solver = new HaversackSolver(ANCESTOR_COLORS_POLICY, 'shiny gold');
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.policy).toBe(ANCESTOR_COLORS_POLICY);
    expect(solver.targetColor).toBe('shiny gold');
  });

  it('solves and traces both omitted and bounded TraceOptions', () => {
    const p1 = new HaversackSolver(ANCESTOR_COLORS_POLICY, 'shiny gold');
    const p2 = new HaversackSolver(NESTED_BAG_COUNT_POLICY, 'shiny gold');
    expect(executeSolver(p1, SAMPLE).answer).toBe(2n);
    expect(executeSolver(p2, SAMPLE).answer).toBe(2n);

    const parsed = p1.parse(SAMPLE);
    expect(p1.trace(parsed).length).toBe(3);
    expect(p1.trace(parsed, { maxSteps: 2 }).length).toBe(2);
  });
});
