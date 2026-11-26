import { describe, expect, it } from 'vitest';
import { CaveBounds } from './boundaryPolicy';
import { SOURCE_X } from './caveScan';

describe('CaveBounds', () => {
  it('computes dynamic width, height, cellCount, and contains', () => {
    const bounds = new CaveBounds(493, 504, 10, null);
    expect(bounds.width).toBe(12);
    expect(bounds.height).toBe(11);
    expect(bounds.cellCount).toBe(132);
    expect(bounds.floorY).toBeNull();
    expect(bounds.contains(SOURCE_X, 0)).toBe(true);
    expect(bounds.contains(493, 10)).toBe(true);
    expect(bounds.contains(492, 0)).toBe(false);
    expect(bounds.contains(505, 0)).toBe(false);
    expect(bounds.contains(500, -1)).toBe(false);
    expect(bounds.contains(500, 11)).toBe(false);
    expect(bounds.contains(500.5, 0)).toBe(false);
    expect(Object.isFrozen(bounds)).toBe(true);
  });

  it('accepts valid floorY within [1, maxY]', () => {
    const bounds = new CaveBounds(490, 510, 11, 11);
    expect(bounds.floorY).toBe(11);
  });

  it('rejects invalid minX, maxX, maxY, or floorY', () => {
    expect(() => new CaveBounds(501, 505, 5, null)).toThrow(RangeError);
    expect(() => new CaveBounds(495, 499, 5, null)).toThrow(RangeError);
    expect(() => new CaveBounds(495.5, 505, 5, null)).toThrow(RangeError);
    expect(() => new CaveBounds(495, 505.5, 5, null)).toThrow(RangeError);
    expect(() => new CaveBounds(495, 505, -1, null)).toThrow(RangeError);
    expect(() => new CaveBounds(495, 505, 1.5, null)).toThrow(RangeError);
    expect(() => new CaveBounds(495, 505, 5, 0)).toThrow(RangeError);
    expect(() => new CaveBounds(495, 505, 5, 6)).toThrow(RangeError);
    expect(() => new CaveBounds(495, 505, 5, 2.5)).toThrow(RangeError);
  });
});
