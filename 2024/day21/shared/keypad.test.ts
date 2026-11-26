import { describe, expect, it } from 'vitest';
import { DIRECTIONAL_KEYS, GridCoord, NUMERIC_KEYS } from './model';
import { DIRECTIONAL_KEYPAD, Keypad, NUMERIC_KEYPAD } from './keypad';

describe('NUMERIC_KEYPAD and DIRECTIONAL_KEYPAD', () => {
  it('exposes frozen standard AoC numeric and directional keypads', () => {
    expect(Object.isFrozen(NUMERIC_KEYPAD)).toBe(true);
    expect(NUMERIC_KEYPAD.rows).toBe(4);
    expect(NUMERIC_KEYPAD.cols).toBe(3);
    expect(NUMERIC_KEYPAD.gap.equals(new GridCoord(3, 0))).toBe(true);
    expect(NUMERIC_KEYPAD.startKey).toBe('A');
    for (const key of NUMERIC_KEYS) {
      expect(NUMERIC_KEYPAD.keyAt(NUMERIC_KEYPAD.positionOf(key))).toBe(key);
    }
    expect(NUMERIC_KEYPAD.keyAt(new GridCoord(3, 0))).toBeNull();
    expect(NUMERIC_KEYPAD.isGapOrOutside(new GridCoord(-1, 0))).toBe(true);
    expect(NUMERIC_KEYPAD.isGapOrOutside(new GridCoord(4, 0))).toBe(true);
    expect(NUMERIC_KEYPAD.isGapOrOutside(new GridCoord(0, -1))).toBe(true);
    expect(NUMERIC_KEYPAD.isGapOrOutside(new GridCoord(0, 3))).toBe(true);

    expect(Object.isFrozen(DIRECTIONAL_KEYPAD)).toBe(true);
    expect(DIRECTIONAL_KEYPAD.rows).toBe(2);
    expect(DIRECTIONAL_KEYPAD.cols).toBe(3);
    expect(DIRECTIONAL_KEYPAD.gap.equals(new GridCoord(0, 0))).toBe(true);
    expect(DIRECTIONAL_KEYPAD.startKey).toBe('A');
    for (const key of DIRECTIONAL_KEYS) {
      expect(DIRECTIONAL_KEYPAD.keyAt(DIRECTIONAL_KEYPAD.positionOf(key))).toBe(key);
    }
    expect(DIRECTIONAL_KEYPAD.keyAt(new GridCoord(0, 0))).toBeNull();
  });

  it('computes gap-avoiding candidatePaths on both keypads', () => {
    expect(NUMERIC_KEYPAD.candidatePaths('A', 'A')).toEqual(['A']);
    expect(NUMERIC_KEYPAD.candidatePaths('A', '0')).toEqual(['<A']);
    expect(NUMERIC_KEYPAD.candidatePaths('0', '2')).toEqual(['^A']);
    expect(NUMERIC_KEYPAD.candidatePaths('A', '1')).toEqual(['^<<A']);
    expect(NUMERIC_KEYPAD.candidatePaths('7', '0')).toEqual(['>vvvA']);
    const twoPaths = NUMERIC_KEYPAD.candidatePaths('2', '9');
    expect(twoPaths).toEqual(['>^^A', '^^>A']);
    expect(Object.isFrozen(twoPaths)).toBe(true);

    expect(DIRECTIONAL_KEYPAD.candidatePaths('<', '^')).toEqual(['>^A']);
    expect(DIRECTIONAL_KEYPAD.candidatePaths('^', '<')).toEqual(['v<A']);
    expect(DIRECTIONAL_KEYPAD.candidatePaths('A', 'v')).toEqual(['<vA', 'v<A']);
  });
});

describe('Keypad validation invariants', () => {
  it('enforces dimensions, corner-gap, null/uniqueness, and valid keys', () => {
    expect(() => new Keypad([], new GridCoord(0, 0), 'A')).toThrow(RangeError);
    expect(() => new Keypad([[]], new GridCoord(0, 0), 'A')).toThrow(RangeError);
    expect(() => new Keypad([['A', 'B'], ['C']], new GridCoord(0, 0), 'A')).toThrow(RangeError);
    // Non-corner gap rejected
    expect(() => new Keypad([['A', null, 'B'], ['C', 'D', 'E']], new GridCoord(0, 1), 'A')).toThrow(RangeError);
    expect(() => new Keypad([['A', 'B'], ['C', 'D'], ['E', 'F']], new GridCoord(1, 0), 'A')).toThrow(RangeError);
    // Gap cell must be null
    expect(() => new Keypad([['A', 'B'], ['C', 'D']], new GridCoord(0, 0), 'A')).toThrow(RangeError);
    // Extra null rejected
    expect(() => new Keypad([[null, null], ['C', 'A']], new GridCoord(0, 0), 'A')).toThrow(RangeError);
    // Duplicate key rejected
    expect(() => new Keypad([[null, 'A'], ['A', 'B']], new GridCoord(0, 0), 'A')).toThrow(RangeError);
    // Unknown startKey rejected
    expect(() => new Keypad([[null, 'B'], ['C', 'D']], new GridCoord(0, 0), 'A')).toThrow(RangeError);
    // Unknown key in positionOf
    expect(() => DIRECTIONAL_KEYPAD.positionOf('X' as never)).toThrow(RangeError);
  });
});
