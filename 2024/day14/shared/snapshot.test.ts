import { describe, expect, it } from 'vitest';
import {
  EXAMPLE_REDOUBT_SPACE,
  RedoubtSnapshot,
  Robot,
  TorusSpace,
  buildRedoubtSnapshot,
} from './index';

describe('RedoubtSnapshot', () => {
  it('makes a defensive copy of occupancy and computes derived metrics dynamically', () => {
    const space = new TorusSpace(3, 3);
    const rawOccupancy = new Uint32Array(space.area);
    rawOccupancy[space.cellIndex(0, 0)] = 2;
    rawOccupancy[space.cellIndex(2, 0)] = 1;
    rawOccupancy[space.cellIndex(0, 2)] = 1;
    rawOccupancy[space.cellIndex(2, 2)] = 3;
    rawOccupancy[space.cellIndex(1, 2)] = 1;

    const snap = new RedoubtSnapshot({ space, second: 7, occupancy: rawOccupancy });
    rawOccupancy.fill(0);

    expect(Object.isFrozen(snap)).toBe(true);
    expect(snap.second).toBe(7);
    expect(snap.highlight).toBe(false);
    expect(snap.label).toBeNull();
    expect(snap.densityAt(0, 0)).toBe(2);
    expect(snap.densityAt(1, 0)).toBe(0);
    expect(snap.totalRobots).toBe(8);
    expect(snap.maxDensity).toBe(3);
    expect(snap.uniqueCells).toBe(5);
    expect(snap.quadrants).toEqual([2, 1, 1, 3]);
    expect(snap.safetyFactor).toBe(6);
    expect(snap.adjacentPairs).toBe(2);
  });

  it('rejects negative seconds, mismatched occupancy length, and out-of-bounds density queries', () => {
    const valid = new Uint32Array(EXAMPLE_REDOUBT_SPACE.area);
    expect(() => new RedoubtSnapshot({ space: EXAMPLE_REDOUBT_SPACE, second: -1, occupancy: valid })).toThrow(
      RangeError,
    );
    expect(
      () =>
        new RedoubtSnapshot({
          space: EXAMPLE_REDOUBT_SPACE,
          second: 0,
          occupancy: new Uint32Array(3),
        }),
    ).toThrow(RangeError);

    const empty = new RedoubtSnapshot({ space: EXAMPLE_REDOUBT_SPACE, second: 0, occupancy: valid });
    expect(empty.maxDensity).toBe(0);
    expect(empty.uniqueCells).toBe(0);
    expect(() => empty.densityAt(11, 0)).toThrow(RangeError);
  });

  it('builds snapshots via buildRedoubtSnapshot with optional highlight and label', () => {
    const robots = [new Robot(0, 0, 1, 0), new Robot(2, 0, 0, 0)];
    const snap = buildRedoubtSnapshot(robots, new TorusSpace(3, 3), 1, {
      highlight: true,
      label: 'Peak clustering',
    });
    expect(snap.highlight).toBe(true);
    expect(snap.label).toBe('Peak clustering');
    expect(snap.densityAt(1, 0)).toBe(1);
    expect(snap.densityAt(2, 0)).toBe(1);
    expect(snap.adjacentPairs).toBe(1);
  });
});
