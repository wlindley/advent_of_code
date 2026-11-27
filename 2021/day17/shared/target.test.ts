import { describe, expect, it } from 'vitest';
import { MAX_TARGET_COORD, parseTargetArea, TargetArea } from './target';

describe('2021 Day 17 TargetArea', () => {
  it('stores validated bounds and computes derived metrics dynamically', () => {
    const target = new TargetArea(20, 30, -10, -5);
    expect(Object.isFrozen(target)).toBe(true);
    expect(target.xMin).toBe(20);
    expect(target.xMax).toBe(30);
    expect(target.yMin).toBe(-10);
    expect(target.yMax).toBe(-5);
    expect(target.width).toBe(11);
    expect(target.height).toBe(6);
    expect(target.minFeasibleVx).toBe(6);
    expect(target.maxFeasibleVy).toBe(9);
    expect(target.maxStep).toBe(20);
  });

  it('handles minimum boundary target x=1..1, y=-1..-1', () => {
    const target = new TargetArea(1, 1, -1, -1);
    expect(target.minFeasibleVx).toBe(1);
    expect(target.maxFeasibleVy).toBe(0);
    expect(target.maxStep).toBe(2);
    expect(target.width).toBe(1);
    expect(target.height).toBe(1);
  });

  it('checks point containment across all four boundary edges', () => {
    const target = new TargetArea(20, 30, -10, -5);
    expect(target.contains(20, -10)).toBe(true);
    expect(target.contains(30, -5)).toBe(true);
    expect(target.contains(19, -7)).toBe(false);
    expect(target.contains(31, -7)).toBe(false);
    expect(target.contains(25, -11)).toBe(false);
    expect(target.contains(25, -4)).toBe(false);
  });

  it('rejects non-integers and out-of-range target bounds', () => {
    expect(() => new TargetArea(1.5, 5, -5, -1)).toThrow(RangeError);
    expect(() => new TargetArea(0, 5, -5, -1)).toThrow(RangeError);
    expect(() => new TargetArea(10, 5, -5, -1)).toThrow(RangeError);
    expect(() => new TargetArea(1, MAX_TARGET_COORD + 1, -5, -1)).toThrow(RangeError);
    expect(() => new TargetArea(1, 5, -MAX_TARGET_COORD - 1, -1)).toThrow(RangeError);
    expect(() => new TargetArea(1, 5, -2, -5)).toThrow(RangeError);
    expect(() => new TargetArea(1, 5, -5, 0)).toThrow(RangeError);
  });

  it('parses trimmed target area strings and rejects malformed inputs', () => {
    const parsed = parseTargetArea('  target area: x=20..30, y=-10..-5\n');
    expect(parsed.xMin).toBe(20);
    expect(parsed.xMax).toBe(30);
    expect(parsed.yMin).toBe(-10);
    expect(parsed.yMax).toBe(-5);

    expect(() => parseTargetArea('')).toThrow(Error);
    expect(() => parseTargetArea('target area: x=20..30')).toThrow(Error);
    expect(() => parseTargetArea('target area: x=30..20, y=-10..-5')).toThrow(RangeError);
  });
});
