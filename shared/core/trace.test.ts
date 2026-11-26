import { describe, expect, it } from 'vitest';
import { sampleTraceIndices, validateMaxSteps } from './trace';

describe('trace sampling utilities', () => {
  it('validates maxSteps with defaults and rejects invalid values', () => {
    expect(validateMaxSteps(undefined, 120)).toBe(120);
    expect(validateMaxSteps(10, 120)).toBe(10);
    expect(() => validateMaxSteps(0, 120)).toThrow(RangeError);
    expect(() => validateMaxSteps(-3, 120)).toThrow(RangeError);
    expect(() => validateMaxSteps(1.5, 120)).toThrow(RangeError);
    expect(() => validateMaxSteps(Number.NaN, 120)).toThrow(RangeError);
  });

  it('samples indices uniformly while preserving endpoints', () => {
    expect(sampleTraceIndices(0, 10)).toEqual([]);
    expect(sampleTraceIndices(4, 10)).toEqual([0, 1, 2, 3]);
    expect(sampleTraceIndices(10, 1)).toEqual([9]);
    expect(sampleTraceIndices(10, 4)).toEqual([0, 3, 6, 9]);
    expect(Object.isFrozen(sampleTraceIndices(5, 3))).toBe(true);
    expect(() => sampleTraceIndices(-1, 5)).toThrow(RangeError);
    expect(() => sampleTraceIndices(2.5, 5)).toThrow(RangeError);
    expect(() => sampleTraceIndices(5, 0)).toThrow(RangeError);
  });
});
