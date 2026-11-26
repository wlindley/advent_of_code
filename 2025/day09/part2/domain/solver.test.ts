import { describe, expect, it } from 'vitest';
import { TilePoint } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, findLargestInscribedRectangle, solver, traceLargestInscribedRectangle } from './index';

const EXAMPLE_INPUT = ['7,1', '11,1', '11,7', '9,7', '9,5', '2,5', '2,3', '7,3'].join('\n');
const pt = (x: number, y: number) => new TilePoint(BigInt(x), BigInt(y));

describe('Day 09 Part 2 solver', () => {
  it('solves the official 8-tile example to 24n with corners (9,5) and (2,3)', () => {
    const points = solver.parse(EXAMPLE_INPUT);
    const result = findLargestInscribedRectangle(points);
    expect(Object.isFrozen(result) && Object.isFrozen(result.match)).toBe(true);
    expect(solver.solve(points)).toBe(24n);
    expect(result.match.rect.area).toBe(24n);
    expect(result.match.indexA).toBe(4);
    expect(result.match.indexB).toBe(6);
    expect(result.rejectedPairs).toBeGreaterThan(0);
  });

  it('finds thin optimal arm, Pac-Man deep notch, canonical ties, and huge/negative BigInts', () => {
    const lArm = [pt(0, 0), pt(19, 0), pt(19, 1), pt(2, 1), pt(2, 3), pt(0, 3)];
    expect(solver.solve(lArm)).toBe(40n);
    const pacman = [
      pt(0, 0), pt(10, 0), pt(10, 3), pt(2, 3), pt(2, 5), pt(10, 5), pt(10, 8), pt(0, 8),
    ];
    // Top wing (0..10,0..3)=11*4=44, bottom wing (0..10,5..8)=11*4=44, left spine (0..2,0..8)=3*9=27
    const pacRes = findLargestInscribedRectangle(pacman);
    expect(pacRes.match.rect.area).toBe(44n);
    expect([pacRes.match.indexA, pacRes.match.indexB]).toEqual([0, 2]); // canonical tie over bottom wing [5, 7]
    const big = 10n ** 18n;
    const minimal = [
      new TilePoint(-big, -big), new TilePoint(big, -big),
      new TilePoint(big, big), new TilePoint(-big, big),
    ];
    const minRes = findLargestInscribedRectangle(minimal);
    expect(minRes.match.rect.area).toBe((2n * big + 1n) ** 2n);
    expect(minRes.rejectedPairs).toBe(0);
  });

  it('validates maxSteps and emits bounded deterministic trace frames', () => {
    const points = solver.parse(EXAMPLE_INPUT);
    expect(() => traceLargestInscribedRectangle(points, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceLargestInscribedRectangle(points, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => traceLargestInscribedRectangle(points, { maxSteps: 1.5 })).toThrow(RangeError);
    expect(() => traceLargestInscribedRectangle(points, { maxSteps: Number.NaN })).toThrow(RangeError);

    const def = solver.trace!(points);
    expect(def.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(def[0]!.isNewBest).toBe(true);
    expect(def[def.length - 1]!.isComplete).toBe(true);
    expect(def[def.length - 1]!.best.area).toBe(24n);
    expect(def.some((f) => !f.isNewBest && f.invalidCells > 0)).toBe(true);

    const single = traceLargestInscribedRectangle(points, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.isComplete).toBe(true);
    expect(single[0]!.best.area).toBe(24n);

    // Multi-candidate comb polygon with > 5 checked pairs to test downsampling with maxSteps = 5
    const comb = [
      pt(0, 0), pt(12, 0), pt(12, 6), pt(10, 6), pt(10, 2), pt(8, 2),
      pt(8, 6), pt(6, 6), pt(6, 2), pt(4, 2), pt(4, 6), pt(0, 6),
    ];
    const sampled = traceLargestInscribedRectangle(comb, { maxSteps: 5 });
    expect(sampled).toHaveLength(5);
    expect(sampled[0]!.step).toBe(1);
    expect(sampled[4]!.isComplete).toBe(true);
    expect(sampled[4]!.step).toBe(sampled[4]!.totalSteps);
  });
});
