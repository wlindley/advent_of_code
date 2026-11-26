import { describe, expect, it } from 'vitest';
import { Hailstone, parseHailstones, TestArea, Vec3 } from './hailstone';
import {
  buildHailTrace2D,
  clipRayToViewport,
  DEFAULT_MAX_TRACE_STEPS,
  MAX_VISIBLE_DOTS,
} from './hailTrace2d';

const EXAMPLE_INPUT = [
  '19, 13, 30 @ -2,  1, -2',
  '18, 19, 22 @ -1, -1, -2',
  '20, 25, 34 @ -2, -2, -4',
  '12, 31, 28 @ -1, -2, -1',
  '20, 19, 15 @  1, -5, -3',
].join('\n');

describe('clipRayToViewport', () => {
  const area = new TestArea(0n, 10n);

  it('clips entering, exiting, and interior rays accurately', () => {
    // Starts outside at (-4, 5) moving (+1, +0) -> enters at x=-2 (t=2), exits at x=12 (t=16)
    const horiz = new Hailstone(0, new Vec3(-4n, 5n, 0n), new Vec3(1n, 0n, 0n));
    const segH = clipRayToViewport(horiz, area, -2n, 12n);
    expect(segH).toEqual({ hailstoneId: 0, x1: -0.2, y1: 0.5, x2: 1.2, y2: 0.5 });

    // Starts inside at (5, 5) moving (-1, -2) -> exits at y=-2 (t=3.5, x=1.5)
    const diag = new Hailstone(1, new Vec3(5n, 5n, 0n), new Vec3(-1n, -2n, 0n));
    const segD = clipRayToViewport(diag, area, -2n, 12n);
    expect(segD).toEqual({ hailstoneId: 1, x1: 0.5, y1: 0.5, x2: 0.15, y2: -0.2 });

    // Stationary inside viewport
    const still = new Hailstone(2, new Vec3(5n, 5n, 0n), new Vec3(0n, 0n, 0n));
    expect(clipRayToViewport(still, area, -2n, 12n)).toEqual({
      hailstoneId: 2,
      x1: 0.5,
      y1: 0.5,
      x2: 0.5,
      y2: 0.5,
    });
  });

  it('returns null when ray is outside, misses diagonally, or points away', () => {
    const parallelLow = new Hailstone(0, new Vec3(-5n, 5n, 0n), new Vec3(0n, 1n, 0n));
    const parallelHigh = new Hailstone(1, new Vec3(15n, 5n, 0n), new Vec3(0n, 1n, 0n));
    const away = new Hailstone(2, new Vec3(-5n, 5n, 0n), new Vec3(-1n, 0n, 0n));
    const missDiag = new Hailstone(3, new Vec3(-10n, 0n, 0n), new Vec3(1n, 2n, 0n));

    expect(clipRayToViewport(parallelLow, area, -2n, 12n)).toBeNull();
    expect(clipRayToViewport(parallelHigh, area, -2n, 12n)).toBeNull();
    expect(clipRayToViewport(away, area, -2n, 12n)).toBeNull();
    expect(clipRayToViewport(missDiag, area, -2n, 12n)).toBeNull();
  });
});

describe('buildHailTrace2D', () => {
  it('handles zero pairs cleanly with one initial frozen frame', () => {
    const area = new TestArea(7n, 27n);
    const frames = buildHailTrace2D([], area);
    expect(frames).toHaveLength(1);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames[0]!.step).toBe(0);
    expect(frames[0]!.totalPairs).toBe(0);
    expect(frames[0]!.activePair).toBeNull();
    expect(frames[0]!.summary.totalPairs).toBe(0);
  });

  it('traces all pairs, filters viewport dots, and shares frozen arrays', () => {
    const area = new TestArea(7n, 27n);
    const stones = parseHailstones(EXAMPLE_INPUT);
    const frames = buildHailTrace2D(stones, area);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(frames).toHaveLength(11);
    expect(frames[0]!.step).toBe(0);
    expect(frames[0]!.activePair).toBeNull();
    expect(frames[10]!.step).toBe(10);
    expect(frames[10]!.summary.inside).toBe(2);
    expect(frames[10]!.summary.totalPairs).toBe(10);
    expect(frames[0]!.rays).toBe(frames[10]!.rays);
    expect(frames[0]!.visibleIntersections).toBe(frames[10]!.visibleIntersections);
    expect(Object.isFrozen(frames[0]!.rays)).toBe(true);
    expect(Object.isFrozen(frames[0]!.visibleIntersections)).toBe(true);
    // Pairs C-D (-24, -19) and A-E (-6, 25.5) are outside padded viewport [3, 31]
    expect(frames[10]!.visibleIntersections.length).toBeLessThan(9);
  });

  it('supports maxSteps = 1 and caps visible dots at MAX_VISIBLE_DOTS while keeping exact summary', () => {
    const area = new TestArea(7n, 27n);
    const stones = parseHailstones(EXAMPLE_INPUT);
    const single = buildHailTrace2D(stones, area, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.step).toBe(10);
    expect(single[0]!.summary.inside).toBe(2);

    const manyStones: Hailstone[] = [];
    for (let i = 0; i < 91; i += 1) {
      manyStones.push(new Hailstone(i, new Vec3(0n, BigInt(i * 10), 0n), new Vec3(100n, BigInt(90 - i), 0n)));
    }
    const capped = buildHailTrace2D(manyStones, new TestArea(0n, 2000n), { maxSteps: 10 });
    expect(capped).toHaveLength(10);
    const last = capped[capped.length - 1]!;
    expect(last.summary.inside).toBe(4095);
    expect(last.visibleIntersections).toHaveLength(MAX_VISIBLE_DOTS);
    expect(last.visiblePrefixCount).toBe(MAX_VISIBLE_DOTS);
  });
});
