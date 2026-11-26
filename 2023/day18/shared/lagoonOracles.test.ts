import { describe, expect, it } from 'vitest';
import { ClosedInterval, IntervalUnion } from '../../../shared/core';
import { type DigDirection, DigStep, parseDigPlan, type RawDigEntry } from './digPlan';
import { LagoonPolygon } from './lagoonPolygon';
import { createLagoonSolver } from './lagoonSolver';
import { DIRECT_DIG_PLAN_DECODER } from './digPlan';

const OFFICIAL_EXAMPLE = [
  'R 6 (#70c710)', 'D 5 (#0dc571)', 'L 2 (#5713f0)', 'D 2 (#d2c081)',
  'R 2 (#59c680)', 'D 2 (#411b91)', 'L 5 (#8ceee2)', 'U 2 (#caa173)',
  'L 1 (#1b58a2)', 'U 2 (#caa171)', 'R 2 (#7807d2)', 'U 3 (#a77fa3)',
  'L 2 (#015232)', 'U 2 (#7a21e3)',
].join('\n');

const OPPOSITE_DIR: Record<DigDirection, DigDirection> = { U: 'D', D: 'U', L: 'R', R: 'L' };
const PART2_DIRS: readonly DigDirection[] = ['R', 'D', 'L', 'U'];

function rasterFloodFillOracle(polygon: LagoonPolygon): bigint {
  const b = polygon.bounds;
  const w = Number(b.spanX) + 3;
  const h = Number(b.spanY) + 3;
  const grid = new Uint8Array(w * h);
  for (const edge of polygon.edges) {
    const steps = Number(edge.distance);
    const sx = Number(edge.start.x - b.minX) + 1;
    const sy = Number(edge.start.y - b.minY) + 1;
    const dx = edge.direction === 'R' ? 1 : edge.direction === 'L' ? -1 : 0;
    const dy = edge.direction === 'D' ? 1 : edge.direction === 'U' ? -1 : 0;
    for (let k = 0; k <= steps; k += 1) grid[(sy + dy * k) * w + (sx + dx * k)] = 1;
  }
  const queue = [0];
  grid[0] = 2;
  for (let head = 0; head < queue.length; head += 1) {
    const idx = queue[head]!;
    const x = idx % w;
    const y = (idx - x) / w;
    const neighbors = [x > 0 ? idx - 1 : -1, x + 1 < w ? idx + 1 : -1, y > 0 ? idx - w : -1, y + 1 < h ? idx + w : -1];
    for (const next of neighbors) {
      if (next >= 0 && grid[next] === 0) {
        grid[next] = 2;
        queue.push(next);
      }
    }
  }
  let count = 0n;
  for (let i = 0; i < grid.length; i += 1) if (grid[i] !== 2) count += 1n;
  return count;
}

function rowUnionLength(polygon: LagoonPolygon, y: bigint, includeHoriz: boolean): bigint {
  const crossings: bigint[] = [];
  const intervals: ClosedInterval[] = [];
  for (const edge of polygon.edges) {
    const end = edge.end;
    if (edge.start.x === end.x) {
      const yLo = edge.start.y < end.y ? edge.start.y : end.y;
      const yHi = edge.start.y > end.y ? edge.start.y : end.y;
      if (yLo <= y && y < yHi) crossings.push(edge.start.x);
    } else if (includeHoriz && edge.start.y === y) {
      const xLo = edge.start.x < end.x ? edge.start.x : end.x;
      const xHi = edge.start.x > end.x ? edge.start.x : end.x;
      intervals.push(new ClosedInterval(xLo, xHi));
    }
  }
  crossings.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (let i = 0; i < crossings.length; i += 2) {
    intervals.push(new ClosedInterval(crossings[i]!, crossings[i + 1]!));
  }
  return new IntervalUnion(intervals).totalLength;
}

function scanlineAreaOracle(polygon: LagoonPolygon): bigint {
  const ySet = new Set<bigint>();
  for (const edge of polygon.edges) ySet.add(edge.start.y);
  const ys = Array.from(ySet).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  let total = 0n;
  for (let i = 0; i < ys.length; i += 1) {
    const y = ys[i]!;
    total += rowUnionLength(polygon, y, true);
    if (i + 1 < ys.length) {
      const gap = ys[i + 1]! - y - 1n;
      if (gap > 0n) total += rowUnionLength(polygon, y + 1n, false) * gap;
    }
  }
  return total;
}

function stepsFromPairs(pairs: readonly [DigDirection, number | bigint][]): LagoonPolygon {
  return LagoonPolygon.fromSteps(pairs.map(([d, len]) => new DigStep(d, BigInt(len), '#abcdef')));
}

function reversePolygon(poly: LagoonPolygon): LagoonPolygon {
  const reversed = [...poly.edges].reverse().map((e) => new DigStep(OPPOSITE_DIR[e.direction], e.distance, e.color));
  return LagoonPolygon.fromSteps(reversed);
}

function decodePart2Entry(entry: RawDigEntry): DigStep {
  const dist = BigInt(`0x${entry.hexCode.slice(0, 5)}`);
  const dir = PART2_DIRS[Number(entry.hexCode[5]!)]!;
  return new DigStep(dir, dist, entry.color);
}

describe('lagoonOracles differential cross-checks', () => {
  const solver = createLagoonSolver(DIRECT_DIG_PLAN_DECODER);

  it('cross-checks official example (CW, CCW, collinear-split) against both oracles', () => {
    const examplePoly = solver.parse(OFFICIAL_EXAMPLE);
    const ccwPoly = reversePolygon(examplePoly);
    const splitSteps = examplePoly.edges.flatMap((e) =>
      e.distance === 6n ? [new DigStep(e.direction, 2n, e.color), new DigStep(e.direction, 4n, e.color)] : [new DigStep(e.direction, e.distance, e.color)],
    );
    const splitPoly = LagoonPolygon.fromSteps(splitSteps);

    for (const poly of [examplePoly, ccwPoly, splitPoly]) {
      expect(poly.totalVolume).toBe(62n);
      expect(rasterFloodFillOracle(poly)).toBe(62n);
      expect(scanlineAreaOracle(poly)).toBe(62n);
    }
  });

  it('cross-checks 1x1, C-shape, U-shape, comb, and inward spiral against both oracles', () => {
    const unit = stepsFromPairs([['R', 1], ['D', 1], ['L', 1], ['U', 1]]);
    const cShape = stepsFromPairs([['R', 6], ['D', 2], ['L', 4], ['D', 3], ['R', 4], ['D', 2], ['L', 6], ['U', 7]]);
    const uShape = stepsFromPairs([['R', 2], ['D', 4], ['R', 3], ['U', 4], ['R', 2], ['D', 6], ['L', 7], ['U', 6]]);
    const comb = stepsFromPairs([
      ['R', 2], ['D', 3], ['R', 2], ['U', 3], ['R', 2], ['D', 3], ['R', 2], ['U', 3],
      ['R', 2], ['D', 5], ['L', 10], ['U', 5],
    ]);
    const spiral = stepsFromPairs([
      ['R', 10], ['D', 10], ['L', 10], ['U', 6], ['R', 6], ['D', 2],
      ['L', 2], ['D', 2], ['R', 4], ['U', 6], ['L', 8], ['U', 2],
    ]);

    for (const poly of [unit, cShape, uShape, comb, spiral]) {
      const flood = rasterFloodFillOracle(poly);
      const scan = scanlineAreaOracle(poly);
      expect(poly.totalVolume).toBe(flood);
      expect(poly.totalVolume).toBe(scan);
    }
  });

  it('cross-checks 10^7-scale non-convex shapes and Part 2 official example (952408144115n)', () => {
    const hugeComb = stepsFromPairs([
      ['R', 10_000_000n], ['D', 25_000_000n], ['R', 15_000_000n], ['U', 25_000_000n],
      ['R', 10_000_000n], ['D', 40_000_000n], ['L', 35_000_000n], ['U', 40_000_000n],
    ]);
    expect(hugeComb.totalVolume).toBe(scanlineAreaOracle(hugeComb));

    const part2Poly = LagoonPolygon.fromSteps(parseDigPlan(OFFICIAL_EXAMPLE).map(decodePart2Entry));
    expect(part2Poly.totalVolume).toBe(952408144115n);
    expect(scanlineAreaOracle(part2Poly)).toBe(952408144115n);
  });
});
