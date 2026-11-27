import { describe, expect, it } from 'vitest';
import {
  FixedRevisitPolicy,
  NO_REVISIT_POLICY,
  SINGLE_SMALL_REVISIT_POLICY,
} from './policy';

describe('FixedRevisitPolicy', () => {
  it('allows entering an unvisited small cave without consuming revisit budget', () => {
    expect(NO_REVISIT_POLICY.initialRevisitBudget).toBe(0);
    expect(NO_REVISIT_POLICY.enterSmallCave(0, false)).toBe(0);
    expect(SINGLE_SMALL_REVISIT_POLICY.initialRevisitBudget).toBe(1);
    expect(SINGLE_SMALL_REVISIT_POLICY.enterSmallCave(1, false)).toBe(1);
  });

  it('consumes revisit budget on revisit when positive and rejects when exhausted', () => {
    expect(NO_REVISIT_POLICY.enterSmallCave(0, true)).toBe(-1);
    expect(SINGLE_SMALL_REVISIT_POLICY.enterSmallCave(1, true)).toBe(0);
    expect(SINGLE_SMALL_REVISIT_POLICY.enterSmallCave(0, true)).toBe(-1);
  });

  it('trims policy name and freezes instances', () => {
    const policy = new FixedRevisitPolicy('  Custom  ', 2);
    expect(policy.name).toBe('Custom');
    expect(policy.initialRevisitBudget).toBe(2);
    expect(Object.isFrozen(policy)).toBe(true);
    expect(policy.enterSmallCave(2, true)).toBe(1);
  });

  it('rejects blank names and negative or non-integer revisit budgets', () => {
    expect(() => new FixedRevisitPolicy('', 0)).toThrow(/name/i);
    expect(() => new FixedRevisitPolicy('   ', 1)).toThrow(/name/i);
    expect(() => new FixedRevisitPolicy('Bad', -1)).toThrow(/budget/i);
    expect(() => new FixedRevisitPolicy('Bad', 1.5)).toThrow(/budget/i);
  });
});
