import { describe, expect, it } from 'vitest';
import { Vec3 } from './vec3';

describe('Vec3', () => {
  it('stores validated safe integers, normalizes -0, and freezes instance', () => {
    const v = new Vec3(-0, 42, -901);
    expect(Object.is(v.x, 0)).toBe(true);
    expect(v.y).toBe(42);
    expect(v.z).toBe(-901);
    expect(Object.isFrozen(v)).toBe(true);
    expect(v.key).toBe('0,42,-901');
    expect(v.format()).toBe('(0, 42, -901)');
  });

  it('rejects non-integer, NaN, Infinity, and unsafe integer coordinates', () => {
    expect(() => new Vec3(1.5, 0, 0)).toThrow(RangeError);
    expect(() => new Vec3(0, Number.NaN, 0)).toThrow(RangeError);
    expect(() => new Vec3(0, 0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => new Vec3(Number.MAX_SAFE_INTEGER + 1, 0, 0)).toThrow(RangeError);
  });

  it('supports vector arithmetic, axis lookup, distances, and equality', () => {
    const a = new Vec3(1, -2, 3);
    const b = new Vec3(-4, 5, 1);

    expect(a.add(b).equals(new Vec3(-3, 3, 4))).toBe(true);
    expect(a.subtract(b).equals(new Vec3(5, -7, 2))).toBe(true);
    expect(a.axis(0)).toBe(1);
    expect(a.axis(1)).toBe(-2);
    expect(a.axis(2)).toBe(3);
    expect(a.manhattanDistanceTo(b)).toBe(5 + 7 + 2);
    expect(a.squaredDistanceTo(b)).toBe(25 + 49 + 4);
    expect(a.equals(new Vec3(1, -2, 3))).toBe(true);
    expect(a.equals(new Vec3(1, -2, 4))).toBe(false);
    expect(a.equals(new Vec3(1, 0, 3))).toBe(false);
    expect(a.equals(new Vec3(0, -2, 3))).toBe(false);
  });
});
