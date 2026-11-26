import { describe, expect, it } from 'vitest';
import { LandingStep, PART1_SLOPES, PART2_SLOPES, Slope, validateSlopes } from './slope';

describe('Slope', () => {
  it('constructs a frozen slope and computes step counts per row height', () => {
    const slope = new Slope(3, 2);
    expect(Object.isFrozen(slope)).toBe(true);
    expect(slope.right).toBe(3);
    expect(slope.down).toBe(2);
    expect(slope.label).toBe('Right 3, Down 2');
    expect(slope.stepCountForRows(1)).toBe(0);
    expect(slope.stepCountForRows(10)).toBe(4);
    expect(slope.stepCountForRows(11)).toBe(5);
  });

  it('rejects invalid right, down, or row counts', () => {
    expect(() => new Slope(-1, 1)).toThrow(RangeError);
    expect(() => new Slope(1.5, 1)).toThrow(RangeError);
    expect(() => new Slope(Number.MAX_SAFE_INTEGER + 1, 1)).toThrow(RangeError);
    expect(() => new Slope(1, 0)).toThrow(RangeError);
    expect(() => new Slope(1, -2)).toThrow(RangeError);
    expect(() => new Slope(1, 1.5)).toThrow(RangeError);
    const slope = new Slope(3, 1);
    expect(() => slope.stepCountForRows(0)).toThrow(RangeError);
    expect(() => slope.stepCountForRows(-3)).toThrow(RangeError);
    expect(() => slope.stepCountForRows(2.5)).toThrow(RangeError);
  });
});

describe('LandingStep', () => {
  it('derives row, col, wrappedCol, and tileRepeat dynamically without stored derived fields', () => {
    const slope = new Slope(3, 1);
    const landing = new LandingStep(4, slope, 11, true);
    expect(Object.isFrozen(landing)).toBe(true);
    expect(landing.stepIndex).toBe(4);
    expect(landing.slope).toBe(slope);
    expect(landing.row).toBe(4);
    expect(landing.col).toBe(12);
    expect(landing.wrappedCol).toBe(1);
    expect(landing.tileRepeat).toBe(1);
    expect(landing.isTree).toBe(true);
    const zeroRight = new LandingStep(2, new Slope(0, 2), 5, false);
    expect(zeroRight.row).toBe(4);
    expect(zeroRight.col).toBe(0);
    expect(zeroRight.wrappedCol).toBe(0);
    expect(zeroRight.tileRepeat).toBe(0);
    expect(zeroRight.isTree).toBe(false);
  });

  it('rejects non-positive stepIndex, forestCols, or unsafe coordinate products', () => {
    const slope = new Slope(3, 1);
    expect(() => new LandingStep(0, slope, 11, false)).toThrow(RangeError);
    expect(() => new LandingStep(1.5, slope, 11, false)).toThrow(RangeError);
    expect(() => new LandingStep(1, slope, 0, false)).toThrow(RangeError);
    expect(() => new LandingStep(1, slope, 2.5, false)).toThrow(RangeError);
    const hugeSlope = new Slope(Number.MAX_SAFE_INTEGER, 2);
    expect(() => new LandingStep(2, hugeSlope, 11, false)).toThrow(RangeError);
    const hugeDown = new Slope(1, Number.MAX_SAFE_INTEGER);
    expect(() => new LandingStep(2, hugeDown, 11, false)).toThrow(RangeError);
  });
});

describe('PART1_SLOPES, PART2_SLOPES, and validateSlopes', () => {
  it('defines frozen canonical slope lists and clones validated slope arrays', () => {
    expect(Object.isFrozen(PART1_SLOPES)).toBe(true);
    expect(Object.isFrozen(PART2_SLOPES)).toBe(true);
    expect(PART1_SLOPES.map((s) => [s.right, s.down])).toEqual([[3, 1]]);
    expect(PART2_SLOPES.map((s) => [s.right, s.down])).toEqual([
      [1, 1],
      [3, 1],
      [5, 1],
      [7, 1],
      [1, 2],
    ]);
    const source = [new Slope(1, 1)];
    const validated = validateSlopes(source);
    source.push(new Slope(2, 1));
    expect(validated).toHaveLength(1);
    expect(Object.isFrozen(validated)).toBe(true);
    expect(() => validateSlopes([])).toThrow(RangeError);
  });
});
