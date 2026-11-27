import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DENSE_TRACE_PREFIX,
  MAX_SUPPORTED_TURN,
  MAX_TRACE_TURN,
  PART1_TARGET_TURN,
  PART2_TARGET_TURN,
  parseStartingSequence,
  RECENT_WINDOW_SIZE,
  StartingSequence,
  validateTargetTurn,
} from './model';

describe('2020 Day 15 model constants and target turn validation', () => {
  it('exposes canonical turn and trace constants', () => {
    expect(PART1_TARGET_TURN).toBe(2020);
    expect(PART2_TARGET_TURN).toBe(30_000_000);
    expect(MAX_TRACE_TURN).toBe(20_000);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    expect(RECENT_WINDOW_SIZE).toBe(16);
    expect(DENSE_TRACE_PREFIX).toBe(16);
    expect(MAX_SUPPORTED_TURN).toBe(0xffff_ffff);
  });

  it('validates targetTurn bounds and rejects invalid values', () => {
    expect(validateTargetTurn(1)).toBe(1);
    expect(validateTargetTurn(PART1_TARGET_TURN)).toBe(2020);
    expect(validateTargetTurn(MAX_SUPPORTED_TURN)).toBe(0xffff_ffff);

    expect(() => validateTargetTurn(0)).toThrow(RangeError);
    expect(() => validateTargetTurn(-5)).toThrow(RangeError);
    expect(() => validateTargetTurn(1.5)).toThrow(RangeError);
    expect(() => validateTargetTurn(Number.NaN)).toThrow(RangeError);
    expect(() => validateTargetTurn(MAX_SUPPORTED_TURN + 1)).toThrow(RangeError);
  });
});

describe('StartingSequence and parseStartingSequence', () => {
  it('builds a frozen immutable StartingSequence with dynamic length and maxInitialValue', () => {
    const raw = [3, 0, 6];
    const seq = new StartingSequence(raw);
    raw[0] = 99;

    expect(seq.values).toEqual([3, 0, 6]);
    expect(seq.length).toBe(3);
    expect(seq.maxInitialValue).toBe(6);
    expect(Object.isFrozen(seq)).toBe(true);
    expect(Object.isFrozen(seq.values)).toBe(true);
  });

  it('rejects empty arrays and negative or non-integer seeds in StartingSequence', () => {
    expect(() => new StartingSequence([])).toThrow(Error);
    expect(() => new StartingSequence([-1])).toThrow(RangeError);
    expect(() => new StartingSequence([1.5])).toThrow(RangeError);
    expect(() => new StartingSequence([Number.MAX_SAFE_INTEGER + 1])).toThrow(RangeError);
  });

  it('parses valid comma-separated starting sequences with surrounding whitespace', () => {
    const seq = parseStartingSequence('  0, 3, 6 \n');
    expect(seq.values).toEqual([0, 3, 6]);
    expect(parseStartingSequence('42').values).toEqual([42]);
  });

  it('rejects empty inputs, malformed commas, non-numeric tokens, and unsafe integers', () => {
    expect(() => parseStartingSequence('')).toThrow(Error);
    expect(() => parseStartingSequence('   \n\t ')).toThrow(Error);
    expect(() => parseStartingSequence(',0,3')).toThrow(Error);
    expect(() => parseStartingSequence('0,3,')).toThrow(Error);
    expect(() => parseStartingSequence('0,,3')).toThrow(Error);
    expect(() => parseStartingSequence('0,-3')).toThrow(Error);
    expect(() => parseStartingSequence('0,abc')).toThrow(Error);
    expect(() => parseStartingSequence('0,1 2')).toThrow(Error);
    expect(() => parseStartingSequence('0,9007199254740992')).toThrow(RangeError);
  });
});
