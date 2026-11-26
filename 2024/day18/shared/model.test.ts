import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RAM_RUN_CONFIG,
  EXAMPLE_RAM_RUN_CONFIG,
  MemorySpace,
  NEVER_CORRUPTED,
  UNVISITED,
  assertNonNegativeInt,
} from './model';

describe('model constants and assertNonNegativeInt', () => {
  it('exposes expected sentinel constants and frozen configs', () => {
    expect(NEVER_CORRUPTED).toBe(0x7fffffff);
    expect(UNVISITED).toBe(-1);
    expect(EXAMPLE_RAM_RUN_CONFIG).toEqual({ gridSize: 7, fallenCount: 12 });
    expect(DEFAULT_RAM_RUN_CONFIG).toEqual({ gridSize: 71, fallenCount: 1024 });
    expect(Object.isFrozen(EXAMPLE_RAM_RUN_CONFIG)).toBe(true);
    expect(Object.isFrozen(DEFAULT_RAM_RUN_CONFIG)).toBe(true);
  });

  it('validates non-negative safe integers', () => {
    expect(() => assertNonNegativeInt(0, 'count')).not.toThrow();
    expect(() => assertNonNegativeInt(42, 'count')).not.toThrow();
    expect(() => assertNonNegativeInt(-1, 'count')).toThrow(RangeError);
    expect(() => assertNonNegativeInt(1.5, 'count')).toThrow(RangeError);
    expect(() => assertNonNegativeInt(Number.POSITIVE_INFINITY, 'count')).toThrow(RangeError);
  });
});

describe('MemorySpace', () => {
  it('tracks earliest fall index, dynamic counts, and defensive copies', () => {
    const space = new MemorySpace(4, [
      { x: 1, y: 2 },
      { x: 1, y: 2 },
      { x: 3, y: 0 },
    ]);

    expect(Object.isFrozen(space)).toBe(true);
    expect(space.gridSize).toBe(4);
    expect(space.cellCount).toBe(16);
    expect(space.byteCount).toBe(3);
    expect(space.cellIndex(1, 2)).toBe(9);
    expect(space.coordOf(9)).toEqual({ x: 1, y: 2 });
    expect(space.firstFallAt(1, 2)).toBe(0);
    expect(space.firstFallAt(3, 0)).toBe(2);
    expect(space.firstFallAt(0, 0)).toBe(NEVER_CORRUPTED);

    expect(space.isCorruptedAt(1, 2, 0)).toBe(false);
    expect(space.isCorruptedAt(1, 2, 1)).toBe(true);
    expect(space.isCorruptedAt(3, 0, 2)).toBe(false);
    expect(space.isCorruptedAt(3, 0, 3)).toBe(true);
    expect(space.isCorruptedAt(0, 0, 0x80000000)).toBe(false);

    const copy = space.copyFirstFallIndices();
    expect(copy).toBeInstanceOf(Int32Array);
    expect(copy[9]).toBe(0);
    copy[9] = 999;
    expect(space.firstFallAt(1, 2)).toBe(0);
  });

  it('rejects invalid grid sizes, out-of-bounds bytes, and invalid lookups', () => {
    expect(() => new MemorySpace(0, [])).toThrow(RangeError);
    expect(() => new MemorySpace(2.5, [])).toThrow(RangeError);
    expect(() => new MemorySpace(3, [{ x: -1, y: 0 }])).toThrow(RangeError);
    expect(() => new MemorySpace(3, [{ x: 3, y: 0 }])).toThrow(RangeError);
    expect(() => new MemorySpace(3, [{ x: 0, y: 3 }])).toThrow(RangeError);
    expect(() => new MemorySpace(3, [{ x: 0.5, y: 1 }])).toThrow(RangeError);

    const space = new MemorySpace(3, [{ x: 1, y: 1 }]);
    expect(space.inBounds(0, 0)).toBe(true);
    expect(space.inBounds(2, 2)).toBe(true);
    expect(space.inBounds(-1, 0)).toBe(false);
    expect(space.inBounds(0, 3)).toBe(false);
    expect(() => space.cellIndex(3, 0)).toThrow(RangeError);
    expect(() => space.coordOf(-1)).toThrow(RangeError);
    expect(() => space.coordOf(9)).toThrow(RangeError);
    expect(() => space.coordOf(1.2)).toThrow(RangeError);
    expect(() => space.isCorruptedAt(0, 0, -1)).toThrow(RangeError);
  });
});
