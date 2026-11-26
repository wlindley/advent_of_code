import { describe, expect, it } from 'vitest';
import { analyzePassword } from './candidate';
import { AT_LEAST_PAIR_POLICY, EXACT_PAIR_POLICY } from './policy';

describe('run-length policies', () => {
  it('exposes frozen policy metadata', () => {
    expect(AT_LEAST_PAIR_POLICY.id).toBe('at-least-pair');
    expect(AT_LEAST_PAIR_POLICY.name).toBe('At Least a Pair');
    expect(AT_LEAST_PAIR_POLICY.ruleSummary.length).toBeGreaterThan(0);
    expect(Object.isFrozen(AT_LEAST_PAIR_POLICY)).toBe(true);

    expect(EXACT_PAIR_POLICY.id).toBe('exact-pair');
    expect(EXACT_PAIR_POLICY.name).toBe('Exact Pair');
    expect(EXACT_PAIR_POLICY.ruleSummary.length).toBeGreaterThan(0);
    expect(Object.isFrozen(EXACT_PAIR_POLICY)).toBe(true);
  });

  it('evaluates individual run lengths', () => {
    expect(AT_LEAST_PAIR_POLICY.acceptsRun(1)).toBe(false);
    expect(AT_LEAST_PAIR_POLICY.acceptsRun(2)).toBe(true);
    expect(AT_LEAST_PAIR_POLICY.acceptsRun(3)).toBe(true);
    expect(AT_LEAST_PAIR_POLICY.acceptsRun(6)).toBe(true);

    expect(EXACT_PAIR_POLICY.acceptsRun(1)).toBe(false);
    expect(EXACT_PAIR_POLICY.acceptsRun(2)).toBe(true);
    expect(EXACT_PAIR_POLICY.acceptsRun(3)).toBe(false);
    expect(EXACT_PAIR_POLICY.acceptsRun(6)).toBe(false);
  });

  it('evaluates candidate runs for Part 1 and Part 2 rules', () => {
    const allOnes = analyzePassword(111_111).runs;
    const tripleOnly = analyzePassword(123_444).runs;
    const triplePlusPair = analyzePassword(111_122).runs;
    const allDistinct = analyzePassword(123_789).runs;

    expect(AT_LEAST_PAIR_POLICY.accepts(allOnes)).toBe(true);
    expect(AT_LEAST_PAIR_POLICY.accepts(tripleOnly)).toBe(true);
    expect(AT_LEAST_PAIR_POLICY.accepts(triplePlusPair)).toBe(true);
    expect(AT_LEAST_PAIR_POLICY.accepts(allDistinct)).toBe(false);

    expect(EXACT_PAIR_POLICY.accepts(allOnes)).toBe(false);
    expect(EXACT_PAIR_POLICY.accepts(tripleOnly)).toBe(false);
    expect(EXACT_PAIR_POLICY.accepts(triplePlusPair)).toBe(true);
    expect(EXACT_PAIR_POLICY.accepts(allDistinct)).toBe(false);
  });
});
