import { describe, expect, it } from 'vitest';
import {
  assertSafeInt,
  classifyStepViolation,
  isSafeStep,
  MAX_SAFE_STEP,
  MIN_SAFE_STEP,
  StepFailure,
} from './step';

describe('step constants & assertSafeInt', () => {
  it('exposes safe step bounds 1..3', () => {
    expect(MIN_SAFE_STEP).toBe(1);
    expect(MAX_SAFE_STEP).toBe(3);
  });

  it('normalizes -0 to +0 and passes valid safe integers', () => {
    expect(assertSafeInt(42, 'level')).toBe(42);
    expect(assertSafeInt(-7, 'level')).toBe(-7);
    expect(Object.is(assertSafeInt(-0, 'level'), 0)).toBe(true);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'throws RangeError for non-safe integer %s',
    (invalid) => {
      expect(() => assertSafeInt(invalid, 'level')).toThrow(RangeError);
    },
  );
});

describe('isSafeStep & classifyStepViolation', () => {
  it('accepts steps 1..3 along expected direction and rejects flat/reversal/jump', () => {
    expect(isSafeStep(1, 2, 1)).toBe(true);
    expect(isSafeStep(1, 4, 1)).toBe(true);
    expect(isSafeStep(5, 2, -1)).toBe(true);
    expect(isSafeStep(5, 5, 1)).toBe(false);
    expect(isSafeStep(5, 4, 1)).toBe(false);
    expect(isSafeStep(1, 5, 1)).toBe(false);
    expect(isSafeStep(5, 1, -1)).toBe(false);
  });

  it('classifies violations with precedence flat > reversal > jump > null', () => {
    expect(classifyStepViolation(1, 3, 1)).toBeNull();
    expect(classifyStepViolation(5, 3, -1)).toBeNull();
    expect(classifyStepViolation(4, 4, 1)).toBe('flat');
    expect(classifyStepViolation(4, 4, -1)).toBe('flat');
    expect(classifyStepViolation(5, 1, 1)).toBe('reversal');
    expect(classifyStepViolation(1, 5, -1)).toBe('reversal');
    expect(classifyStepViolation(1, 5, 1)).toBe('jump');
    expect(classifyStepViolation(5, 1, -1)).toBe('jump');
  });
});

describe('StepFailure', () => {
  it('freezes fields, normalizes -0, and computes delta dynamically', () => {
    const failure = new StepFailure(-0, -0, 5, 'jump');
    expect(Object.isFrozen(failure)).toBe(true);
    expect(Object.is(failure.index, 0)).toBe(true);
    expect(Object.is(failure.prev, 0)).toBe(true);
    expect(failure.next).toBe(5);
    expect(failure.reason).toBe('jump');
    expect(failure.delta).toBe(5);

    const rev = new StepFailure(2, 7, 3, 'reversal');
    expect(rev.delta).toBe(-4);
  });

  it('rejects negative index and non-safe-integer fields', () => {
    expect(() => new StepFailure(-1, 1, 2, 'flat')).toThrow(RangeError);
    expect(() => new StepFailure(1.5, 1, 2, 'flat')).toThrow(RangeError);
    expect(() => new StepFailure(0, 1.5, 2, 'flat')).toThrow(RangeError);
    expect(() => new StepFailure(0, 1, Number.NaN, 'flat')).toThrow(RangeError);
  });
});
