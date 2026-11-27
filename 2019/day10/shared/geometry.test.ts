import { describe, expect, it } from 'vitest';
import {
  AsteroidPoint,
  compareRaysClockwise,
  gcdInt,
  rayHalfPlane,
  reduceRay,
} from './geometry';

describe('gcdInt', () => {
  it('computes greatest common divisor across positive, negative, and zero inputs', () => {
    expect(gcdInt(0, 0)).toBe(0);
    expect(gcdInt(0, 7)).toBe(7);
    expect(gcdInt(-9, 0)).toBe(9);
    expect(gcdInt(12, 18)).toBe(6);
    expect(gcdInt(-12, 18)).toBe(6);
    expect(gcdInt(12, -18)).toBe(6);
    expect(gcdInt(-15, -25)).toBe(5);
    expect(gcdInt(17, 13)).toBe(1);
  });

  it('rejects non-integer or unsafe inputs', () => {
    expect(() => gcdInt(1.5, 2)).toThrow(RangeError);
    expect(() => gcdInt(2, Number.NaN)).toThrow(RangeError);
    expect(() => gcdInt(Number.MAX_SAFE_INTEGER + 1, 2)).toThrow(RangeError);
  });
});

describe('reduceRay', () => {
  it('reduces displacements to coprime rays and positive steps without -0', () => {
    const r1 = reduceRay(0, -4);
    expect(r1.step).toBe(4);
    expect(Object.is(r1.ray.rx, 0)).toBe(true);
    expect(r1.ray.ry).toBe(-1);
    expect(Object.isFrozen(r1)).toBe(true);
    expect(Object.isFrozen(r1.ray)).toBe(true);

    const r2 = reduceRay(-6, 0);
    expect(r2.step).toBe(6);
    expect(r2.ray.rx).toBe(-1);
    expect(Object.is(r2.ray.ry, 0)).toBe(true);

    const r3 = reduceRay(-6, 9);
    expect(r3.step).toBe(3);
    expect(r3.ray).toEqual({ rx: -2, ry: 3 });
  });

  it('rejects zero displacement and non-safe-integer coordinates', () => {
    expect(() => reduceRay(0, 0)).toThrow(RangeError);
    expect(() => reduceRay(1.2, 3)).toThrow(RangeError);
    expect(() => reduceRay(3, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('rayHalfPlane and compareRaysClockwise', () => {
  it('classifies half-planes starting from 12 o-clock clockwise', () => {
    expect(rayHalfPlane({ rx: 0, ry: -1 })).toBe(0);
    expect(rayHalfPlane({ rx: 1, ry: -2 })).toBe(0);
    expect(rayHalfPlane({ rx: 1, ry: 0 })).toBe(0);
    expect(rayHalfPlane({ rx: 1, ry: 2 })).toBe(0);
    expect(rayHalfPlane({ rx: 0, ry: 1 })).toBe(1);
    expect(rayHalfPlane({ rx: -1, ry: 2 })).toBe(1);
    expect(rayHalfPlane({ rx: -1, ry: 0 })).toBe(1);
    expect(rayHalfPlane({ rx: -1, ry: -2 })).toBe(1);
  });

  it('orders rays clockwise from straight up (0, -1)', () => {
    const clock = [
      { rx: 0, ry: -1 },
      { rx: 1, ry: -3 },
      { rx: 1, ry: -1 },
      { rx: 3, ry: -1 },
      { rx: 1, ry: 0 },
      { rx: 3, ry: 1 },
      { rx: 1, ry: 1 },
      { rx: 1, ry: 3 },
      { rx: 0, ry: 1 },
      { rx: -1, ry: 3 },
      { rx: -1, ry: 1 },
      { rx: -3, ry: 1 },
      { rx: -1, ry: 0 },
      { rx: -3, ry: -1 },
      { rx: -1, ry: -1 },
      { rx: -1, ry: -3 },
    ];
    const shuffled = [...clock].reverse();
    shuffled.sort(compareRaysClockwise);
    expect(shuffled).toEqual(clock);
    expect(compareRaysClockwise(clock[0]!, clock[0]!)).toBe(0);
    expect(compareRaysClockwise(clock[0]!, clock[8]!)).toBeLessThan(0);
    expect(compareRaysClockwise(clock[8]!, clock[0]!)).toBeGreaterThan(0);
  });
});

describe('AsteroidPoint', () => {
  it('stores immutable non-negative coordinates and computes coordinateCode', () => {
    const pt = new AsteroidPoint(11, 2);
    expect(pt.x).toBe(11);
    expect(pt.y).toBe(2);
    expect(pt.coordinateCode).toBe(1102);
    expect(Object.isFrozen(pt)).toBe(true);
    expect(new AsteroidPoint(0, 0).coordinateCode).toBe(0);
  });

  it('rejects negative or non-safe-integer coordinates', () => {
    expect(() => new AsteroidPoint(-1, 0)).toThrow(RangeError);
    expect(() => new AsteroidPoint(0, -1)).toThrow(RangeError);
    expect(() => new AsteroidPoint(1.5, 0)).toThrow(RangeError);
    expect(() => new AsteroidPoint(0, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});
