import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../shared/core';
import { Cuboid } from './cuboid';

function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Cuboid {
  return new Cuboid(
    new ClosedInterval(BigInt(x0), BigInt(x1)),
    new ClosedInterval(BigInt(y0), BigInt(y1)),
    new ClosedInterval(BigInt(z0), BigInt(z1)),
  );
}

describe('Cuboid', () => {
  it('computes exact bigint volume and freezes instances', () => {
    const c = box(10, 12, 10, 12, 10, 12);
    expect(c.volume).toBe(27n);
    expect(Object.isFrozen(c)).toBe(true);

    const huge = box(-1_000_000_000, 1_000_000_000, 0, 1_000_000, -5, 4);
    expect(huge.volume).toBe(2_000_000_001n * 1_000_001n * 10n);
  });

  it('detects overlaps across all three axes and returns null on disjoint intersection', () => {
    const base = box(0, 5, 0, 5, 0, 5);
    expect(base.overlaps(box(6, 8, 0, 5, 0, 5))).toBe(false);
    expect(base.overlaps(box(0, 5, 6, 8, 0, 5))).toBe(false);
    expect(base.overlaps(box(0, 5, 0, 5, 6, 8))).toBe(false);
    expect(base.intersection(box(6, 8, 0, 5, 0, 5))).toBeNull();

    const inter = base.intersection(box(3, 8, -2, 2, 5, 9));
    expect(inter).not.toBeNull();
    expect(inter!.x.start).toBe(3n);
    expect(inter!.x.end).toBe(5n);
    expect(inter!.y.start).toBe(0n);
    expect(inter!.y.end).toBe(2n);
    expect(inter!.z.start).toBe(5n);
    expect(inter!.z.end).toBe(5n);
    expect(inter!.volume).toBe(3n * 3n * 1n);
  });

  it('returns [this] untouched when subtracting a disjoint cuboid', () => {
    const base = box(0, 4, 0, 4, 0, 4);
    const parts = base.subtract(box(5, 8, 0, 4, 0, 4));
    expect(Object.isFrozen(parts)).toBe(true);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toBe(base);
  });

  it('returns empty array when cut completely encloses the cuboid', () => {
    const base = box(1, 3, 1, 3, 1, 3);
    expect(base.subtract(box(0, 4, 0, 4, 0, 4))).toEqual([]);
  });

  it('splits an interior cut into 6 pairwise-disjoint slabs preserving exact volume', () => {
    const outer = box(0, 4, 0, 4, 0, 4);
    const inner = box(2, 2, 2, 2, 2, 2);
    const slabs = outer.subtract(inner);

    expect(slabs).toHaveLength(6);
    const total = slabs.reduce((acc, s) => acc + s.volume, 0n);
    expect(total).toBe(outer.volume - inner.volume);

    for (let i = 0; i < slabs.length; i += 1) {
      expect(slabs[i]!.overlaps(inner)).toBe(false);
      for (let j = i + 1; j < slabs.length; j += 1) {
        expect(slabs[i]!.overlaps(slabs[j]!)).toBe(false);
      }
    }
  });

  it('handles partial corner overlap cleanly', () => {
    const a = box(10, 12, 10, 12, 10, 12);
    const b = box(9, 11, 9, 11, 9, 11);
    const slabs = a.subtract(b);
    const total = slabs.reduce((acc, s) => acc + s.volume, 0n);
    expect(total).toBe(27n - 8n);
    for (let i = 0; i < slabs.length; i += 1) {
      expect(slabs[i]!.overlaps(b)).toBe(false);
      for (let j = i + 1; j < slabs.length; j += 1) {
        expect(slabs[i]!.overlaps(slabs[j]!)).toBe(false);
      }
    }
  });
});
