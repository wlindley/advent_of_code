import { describe, expect, it } from 'vitest';
import {
  ChainSolveResult,
  CodeComplexity,
  DIRECTIONAL_KEYS,
  DIRECTION_DELTAS,
  DoorCode,
  GridCoord,
  KeypadConfig,
  NUMERIC_KEYS,
  PART1_DIRECTIONAL_ROBOTS,
  PART2_DIRECTIONAL_ROBOTS,
} from './model';

describe('model constants and GridCoord', () => {
  it('exposes frozen key lists, robot counts, and direction deltas', () => {
    expect(PART1_DIRECTIONAL_ROBOTS).toBe(2);
    expect(PART2_DIRECTIONAL_ROBOTS).toBe(25);
    expect(NUMERIC_KEYS).toEqual(['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', 'A']);
    expect(DIRECTIONAL_KEYS).toEqual(['^', 'A', '<', 'v', '>']);
    expect(Object.isFrozen(NUMERIC_KEYS)).toBe(true);
    expect(Object.isFrozen(DIRECTIONAL_KEYS)).toBe(true);
    expect(Object.isFrozen(DIRECTION_DELTAS)).toBe(true);
    expect(DIRECTION_DELTAS['^'].equals(new GridCoord(-1, 0))).toBe(true);
    expect(DIRECTION_DELTAS['v'].equals(new GridCoord(1, 0))).toBe(true);
    expect(DIRECTION_DELTAS['<'].equals(new GridCoord(0, -1))).toBe(true);
    expect(DIRECTION_DELTAS['>'].equals(new GridCoord(0, 1))).toBe(true);
  });

  it('validates GridCoord safe integers including negative coordinates and checks equality', () => {
    const a = new GridCoord(-1, 2);
    expect(Object.isFrozen(a)).toBe(true);
    expect(a.equals(new GridCoord(-1, 2))).toBe(true);
    expect(a.equals(new GridCoord(-1, 3))).toBe(false);
    expect(a.equals(new GridCoord(0, 2))).toBe(false);
    expect(() => new GridCoord(1.5, 0)).toThrow(RangeError);
    expect(() => new GridCoord(0, Number.NaN)).toThrow(RangeError);
  });
});

describe('DoorCode, KeypadConfig, CodeComplexity, ChainSolveResult', () => {
  it('validates DoorCode and computes dynamic numericValue and keys', () => {
    const code = new DoorCode('029A');
    expect(Object.isFrozen(code)).toBe(true);
    expect(code.raw).toBe('029A');
    expect(code.numericValue).toBe(29n);
    expect(code.keys).toEqual(['0', '2', '9', 'A']);
    expect(Object.isFrozen(code.keys)).toBe(true);

    expect(() => new DoorCode('')).toThrow(RangeError);
    expect(() => new DoorCode('029')).toThrow(RangeError);
    expect(() => new DoorCode('A29A')).toThrow(RangeError);
    expect(() => new DoorCode(' 029A')).toThrow(RangeError);
  });

  it('validates KeypadConfig, CodeComplexity, and aggregates ChainSolveResult', () => {
    const config = new KeypadConfig(0);
    expect(config.directionalRobots).toBe(0);
    expect(Object.isFrozen(config)).toBe(true);
    expect(() => new KeypadConfig(-1)).toThrow(RangeError);
    expect(() => new KeypadConfig(1.5)).toThrow(RangeError);

    const c1 = new CodeComplexity(new DoorCode('029A'), 68n);
    const c2 = new CodeComplexity(new DoorCode('980A'), 60n);
    expect(c1.complexity).toBe(1972n);
    expect(c2.complexity).toBe(58800n);
    expect(Object.isFrozen(c1)).toBe(true);
    expect(() => new CodeComplexity(new DoorCode('029A'), 0n)).toThrow(RangeError);

    const result = new ChainSolveResult(new KeypadConfig(2), [c1, c2]);
    expect(result.config.directionalRobots).toBe(2);
    expect(result.entries).toHaveLength(2);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.entries)).toBe(true);
    expect(result.totalComplexity).toBe(60772n);
  });
});
