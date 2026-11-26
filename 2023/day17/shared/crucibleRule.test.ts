import { describe, expect, it } from 'vitest';
import { CLUMSY_CRUCIBLE_RULE, CrucibleRule, ULTRA_CRUCIBLE_RULE } from './crucibleRule';

describe('CrucibleRule', () => {
  it('constructs frozen rules with valid positive integer bounds', () => {
    const equalBounds = new CrucibleRule(1, 1);
    expect(equalBounds.minRun).toBe(1);
    expect(equalBounds.maxRun).toBe(1);
    expect(Object.isFrozen(equalBounds)).toBe(true);

    expect(CLUMSY_CRUCIBLE_RULE.minRun).toBe(1);
    expect(CLUMSY_CRUCIBLE_RULE.maxRun).toBe(3);
    expect(ULTRA_CRUCIBLE_RULE.minRun).toBe(4);
    expect(ULTRA_CRUCIBLE_RULE.maxRun).toBe(10);
  });

  it('rejects non-integer or non-positive minRun', () => {
    expect(() => new CrucibleRule(0, 3)).toThrow(RangeError);
    expect(() => new CrucibleRule(-1, 3)).toThrow(RangeError);
    expect(() => new CrucibleRule(1.5, 3)).toThrow(RangeError);
  });

  it('rejects non-integer maxRun or maxRun < minRun', () => {
    expect(() => new CrucibleRule(2, 1)).toThrow(RangeError);
    expect(() => new CrucibleRule(1, 2.5)).toThrow(RangeError);
  });
});
