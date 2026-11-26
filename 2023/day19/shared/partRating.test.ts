import { describe, expect, it } from 'vitest';
import { PartRating } from './partRating';
import {
  CATEGORIES,
  ENTRY_WORKFLOW,
  isTerminalOutcome,
  validatePositiveInt,
  validateWorkflowName,
  validateWorkflowTarget,
} from './types';

describe('Day 19 shared types and PartRating', () => {
  it('exposes canonical categories and entry workflow', () => {
    expect(CATEGORIES).toEqual(['x', 'm', 'a', 's']);
    expect(Object.isFrozen(CATEGORIES)).toBe(true);
    expect(ENTRY_WORKFLOW).toBe('in');
  });

  it('validates terminal outcomes, workflow names, targets, and positive ints', () => {
    expect(isTerminalOutcome('A')).toBe(true);
    expect(isTerminalOutcome('R')).toBe(true);
    expect(isTerminalOutcome('in')).toBe(false);
    expect(validateWorkflowName('qqz')).toBe('qqz');
    expect(() => validateWorkflowName('A')).toThrow();
    expect(() => validateWorkflowName('q1')).toThrow();
    expect(validateWorkflowTarget('A')).toBe('A');
    expect(validateWorkflowTarget('R')).toBe('R');
    expect(validateWorkflowTarget('px')).toBe('px');
    expect(() => validateWorkflowTarget('Bad')).toThrow();
    expect(validatePositiveInt(1, 'v')).toBe(1);
    expect(() => validatePositiveInt(0, 'v')).toThrow(RangeError);
    expect(() => validatePositiveInt(1.5, 'v')).toThrow(RangeError);
  });

  it('constructs frozen PartRating with dynamic total and valueOf', () => {
    const part = new PartRating({ x: 787, m: 2655, a: 1222, s: 2876 });
    expect(Object.isFrozen(part)).toBe(true);
    expect(part.x).toBe(787);
    expect(part.valueOf('x')).toBe(787);
    expect(part.valueOf('m')).toBe(2655);
    expect(part.valueOf('a')).toBe(1222);
    expect(part.valueOf('s')).toBe(2876);
    expect(part.total).toBe(7540);
  });

  it('rejects non-positive or non-integer rating values', () => {
    expect(() => new PartRating({ x: 0, m: 1, a: 1, s: 1 })).toThrow(RangeError);
    expect(() => new PartRating({ x: 1, m: -3, a: 1, s: 1 })).toThrow(RangeError);
    expect(() => new PartRating({ x: 1, m: 1, a: 2.5, s: 1 })).toThrow(RangeError);
    expect(() => new PartRating({ x: 1, m: 1, a: 1, s: Number.NaN })).toThrow(RangeError);
  });
});
