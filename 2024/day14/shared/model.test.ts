import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REDOUBT_SPACE,
  EXAMPLE_REDOUBT_SPACE,
  Robot,
  TorusSpace,
  assertNonNegativeSafeInt,
  stepCoordinate,
} from './model';

describe('assertNonNegativeSafeInt', () => {
  it('accepts zero and positive safe integers', () => {
    expect(() => assertNonNegativeSafeInt(0, 't')).not.toThrow();
    expect(() => assertNonNegativeSafeInt(100, 't')).not.toThrow();
  });

  it('rejects negative, fractional, NaN, and unsafe integers', () => {
    expect(() => assertNonNegativeSafeInt(-1, 't')).toThrow(RangeError);
    expect(() => assertNonNegativeSafeInt(1.5, 't')).toThrow(RangeError);
    expect(() => assertNonNegativeSafeInt(Number.NaN, 't')).toThrow(RangeError);
    expect(() => assertNonNegativeSafeInt(Number.MAX_SAFE_INTEGER + 1, 't')).toThrow(RangeError);
  });
});

describe('stepCoordinate', () => {
  it('matches the official example robot p=2,4 v=2,-3 on 11x7 across t=0..5', () => {
    const xs = [0, 1, 2, 3, 4, 5].map((t) => stepCoordinate(2, 2, 11, t));
    const ys = [0, 1, 2, 3, 4, 5].map((t) => stepCoordinate(4, -3, 7, t));
    expect(xs).toEqual([2, 4, 6, 8, 10, 1]);
    expect(ys).toEqual([4, 1, 5, 2, 6, 3]);
  });

  it('handles negative velocities, multi-period wraps, and rejects negative seconds', () => {
    expect(stepCoordinate(0, -1000, 11, 77)).toBe(0);
    expect(stepCoordinate(3, -10, 7, 100)).toBe(stepCoordinate(3, -3, 7, 100 % 7));
    expect(() => stepCoordinate(0, 1, 11, -1)).toThrow(RangeError);
  });
});

describe('TorusSpace', () => {
  it('exposes frozen default and example spaces with computed midpoints and area', () => {
    expect(Object.isFrozen(DEFAULT_REDOUBT_SPACE)).toBe(true);
    expect(DEFAULT_REDOUBT_SPACE.width).toBe(101);
    expect(DEFAULT_REDOUBT_SPACE.height).toBe(103);
    expect(DEFAULT_REDOUBT_SPACE.midX).toBe(50);
    expect(DEFAULT_REDOUBT_SPACE.midY).toBe(51);
    expect(DEFAULT_REDOUBT_SPACE.area).toBe(10403);

    expect(EXAMPLE_REDOUBT_SPACE.midX).toBe(5);
    expect(EXAMPLE_REDOUBT_SPACE.midY).toBe(3);
    expect(EXAMPLE_REDOUBT_SPACE.area).toBe(77);
  });

  it('rejects even, non-positive, non-integer, and overflowing dimensions', () => {
    expect(() => new TorusSpace(10, 7)).toThrow(RangeError);
    expect(() => new TorusSpace(11, 8)).toThrow(RangeError);
    expect(() => new TorusSpace(0, 7)).toThrow(RangeError);
    expect(() => new TorusSpace(-3, 7)).toThrow(RangeError);
    expect(() => new TorusSpace(11, 1.5)).toThrow(RangeError);
    expect(() => new TorusSpace(94_906_267, 94_906_267)).toThrow(RangeError);
  });

  it('computes bounds-checked cellIndex and quadrantOf including 1x1 and midlines', () => {
    expect(EXAMPLE_REDOUBT_SPACE.cellIndex(2, 4)).toBe(46);
    expect(() => EXAMPLE_REDOUBT_SPACE.cellIndex(-1, 0)).toThrow(RangeError);
    expect(() => EXAMPLE_REDOUBT_SPACE.cellIndex(11, 0)).toThrow(RangeError);
    expect(() => EXAMPLE_REDOUBT_SPACE.cellIndex(0, 7)).toThrow(RangeError);

    expect(EXAMPLE_REDOUBT_SPACE.quadrantOf(0, 0)).toBe(0);
    expect(EXAMPLE_REDOUBT_SPACE.quadrantOf(10, 0)).toBe(1);
    expect(EXAMPLE_REDOUBT_SPACE.quadrantOf(0, 6)).toBe(2);
    expect(EXAMPLE_REDOUBT_SPACE.quadrantOf(10, 6)).toBe(3);
    expect(EXAMPLE_REDOUBT_SPACE.quadrantOf(5, 0)).toBeNull();
    expect(EXAMPLE_REDOUBT_SPACE.quadrantOf(0, 3)).toBeNull();

    const tiny = new TorusSpace(1, 1);
    expect(tiny.quadrantOf(0, 0)).toBeNull();
  });
});

describe('Robot', () => {
  it('stores frozen coordinates and advances on a TorusSpace', () => {
    const robot = new Robot(2, 4, 2, -3);
    expect(Object.isFrozen(robot)).toBe(true);
    const pos = robot.positionAt(EXAMPLE_REDOUBT_SPACE, 5);
    expect(Object.isFrozen(pos)).toBe(true);
    expect(pos).toEqual({ x: 1, y: 3 });
  });

  it('rejects invalid initial positions or non-safe-integer velocities', () => {
    expect(() => new Robot(-1, 0, 1, 1)).toThrow(RangeError);
    expect(() => new Robot(0, -1, 1, 1)).toThrow(RangeError);
    expect(() => new Robot(0, 0, 1.5, 1)).toThrow(RangeError);
    expect(() => new Robot(0, 0, 1, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
