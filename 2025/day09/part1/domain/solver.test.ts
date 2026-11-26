import { describe, expect, it } from 'vitest';
import { TilePoint, TileRect, parseTilePoints } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, findLargestTileRectangle, solver, traceLargestTileRectangle } from './index';

const EXAMPLE = '7,1\n11,1\n11,7\n9,7\n9,5\n2,5\n2,3\n7,3';
const pts = (coords: readonly [bigint, bigint][]) => coords.map(([x, y]) => new TilePoint(x, y));

function bruteForceMaxArea(points: readonly TilePoint[]): bigint {
  let max = 0n;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const area = new TileRect(points[i]!, points[j]!).area;
      if (area > max) max = area;
    }
  }
  return max;
}

describe('Day 9 Part 1 solver', () => {
  it('solves the AoC 8-tile example to 50n', () => {
    expect(solver.solve(solver.parse(EXAMPLE))).toBe(50n);
  });

  it('handles duplicates, collinear lines, NW-SE, anti-diagonal, and 10^18 coords', () => {
    expect(findLargestTileRectangle(pts([[5n, 5n], [5n, 5n]])).match.rect.area).toBe(1n);
    expect(findLargestTileRectangle(pts([[1n, 1n], [1n, 1n], [4n, 4n]])).match.rect.area).toBe(16n);
    expect(findLargestTileRectangle(pts([[1n, 3n], [5n, 3n], [9n, 3n]])).match.rect.area).toBe(9n);
    expect(findLargestTileRectangle(pts([[4n, 1n], [4n, 8n], [4n, 3n]])).match.rect.area).toBe(8n);
    expect(findLargestTileRectangle(pts([[2n, 9n], [10n, 1n]])).match.rect.area).toBe(81n);
    expect(findLargestTileRectangle(pts([[0n, 10n], [3n, 7n], [7n, 3n], [10n, 0n]])).match.rect.area).toBe(121n);
    const huge = 1000000000000000000n;
    expect(findLargestTileRectangle(pts([[-huge, -huge], [huge, huge]])).match.rect.area).toBe((2n * huge + 1n) ** 2n);
  });

  it('breaks area ties deterministically by canonical (indexA, indexB)', () => {
    expect(findLargestTileRectangle(pts([[0n, 0n], [0n, 10n], [5n, 0n], [5n, 10n]])).match).toMatchObject({ indexA: 0, indexB: 3 });
    expect(findLargestTileRectangle(pts([[0n, 5n], [1n, 5n], [4n, 2n], [3n, 9n]])).match).toMatchObject({ indexA: 0, indexB: 2 });
    expect(findLargestTileRectangle(pts([[0n, 5n], [1n, 5n], [3n, 9n], [4n, 2n]])).match).toMatchObject({ indexA: 0, indexB: 2 });
    expect(findLargestTileRectangle(pts([[0n, 0n], [0n, 0n], [0n, 0n]])).match).toMatchObject({ indexA: 0, indexB: 1 });
    expect(findLargestTileRectangle(pts([[0n, 0n], [4n, 4n], [4n, 0n], [0n, 4n]])).match).toMatchObject({ indexA: 0, indexB: 1 });
  });

  it('rejects < 2 points and invalid trace maxSteps options', () => {
    expect(() => findLargestTileRectangle([])).toThrow();
    expect(() => findLargestTileRectangle([new TilePoint(1n, 2n)])).toThrow();
    const two = pts([[0n, 0n], [2n, 2n]]);
    for (const bad of [0, -1, 1.5, Number.NaN]) expect(() => traceLargestTileRectangle(two, { maxSteps: bad })).toThrow(RangeError);
  });

  it('traces with default options, maxSteps=1, and deterministic downsampling', () => {
    const full = solver.trace!(parseTilePoints(EXAMPLE));
    expect(full.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect([full.at(-1)?.isComplete, full.at(-1)?.best.area]).toEqual([true, 50n]);

    const many = pts(Array.from({ length: 30 }, (_, i) => [BigInt(i), BigInt((i * 7) % 29)]));
    const expectedArea = bruteForceMaxArea(many);
    const one = traceLargestTileRectangle(many, { maxSteps: 1 });
    expect([one.length, one[0]!.isComplete, one[0]!.best.area]).toEqual([1, true, expectedArea]);

    const sampled = traceLargestTileRectangle(many, { maxSteps: 5 });
    expect(sampled).toHaveLength(5);
    expect(sampled.slice(0, 4).every((f) => !f.isComplete)).toBe(true);
    expect([sampled[4]!.isComplete, sampled[4]!.best.area]).toEqual([true, expectedArea]);
  });

  it('matches brute-force oracle across 60 seeded diverse datasets', () => {
    let seed = 0x9e3779b9;
    const nextInt = (mod: number) => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) % mod);
    for (let t = 0; t < 60; t++) {
      const n = 2 + (t % 79);
      const data: [bigint, bigint][] = Array.from({ length: n }, (_, k) =>
        t % 5 === 0 ? [BigInt(k), BigInt(n - k)] : [BigInt(nextInt(30) - 10), BigInt(nextInt(30) - 10)],
      );
      const p = pts(data);
      expect(findLargestTileRectangle(p).match.rect.area).toBe(bruteForceMaxArea(p));
    }
  });
});
