import { describe, expect, it } from 'vitest';
import {
  BROADCASTER_NAME,
  BUTTON_NAME,
  DEFAULT_MAX_PULSES_PER_PRESS,
  validateModuleName,
  validatePositiveInt,
} from './types';

describe('day20 types and validators', () => {
  it('exposes protocol constants', () => {
    expect(BROADCASTER_NAME).toBe('broadcaster');
    expect(BUTTON_NAME).toBe('button');
    expect(DEFAULT_MAX_PULSES_PER_PRESS).toBe(1_000_000);
  });

  it('accepts valid lowercase alphabetic module names including broadcaster', () => {
    expect(validateModuleName('broadcaster')).toBe('broadcaster');
    expect(validateModuleName('a')).toBe('a');
    expect(validateModuleName('inv')).toBe('inv');
    expect(validateModuleName('rx')).toBe('rx');
  });

  it('rejects empty, reserved button, uppercase, numeric, and symbol module names', () => {
    expect(() => validateModuleName('')).toThrow();
    expect(() => validateModuleName('button')).toThrow();
    expect(() => validateModuleName('Broadcaster')).toThrow();
    expect(() => validateModuleName('a1')).toThrow();
    expect(() => validateModuleName('a_b')).toThrow();
    expect(() => validateModuleName(' a')).toThrow();
  });

  it('validates positive integers and rejects non-positive or non-integer values', () => {
    expect(validatePositiveInt(1, 'count')).toBe(1);
    expect(validatePositiveInt(1000, 'count')).toBe(1000);
    expect(() => validatePositiveInt(0, 'count')).toThrow(RangeError);
    expect(() => validatePositiveInt(-5, 'count')).toThrow(RangeError);
    expect(() => validatePositiveInt(1.5, 'count')).toThrow(RangeError);
    expect(() => validatePositiveInt(Number.NaN, 'count')).toThrow(RangeError);
  });
});
