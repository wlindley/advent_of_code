import { describe, expect, it } from 'vitest';
import {
  type Clock,
  ClosedInterval,
  executeSolver,
  IntervalUnion,
} from '../../../../shared/core';
import { type LagoonPolygon, projectPolygonToSvg } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  'R 6 (#70c710)', 'D 5 (#0dc571)', 'L 2 (#5713f0)', 'D 2 (#d2c081)',
  'R 2 (#59c680)', 'D 2 (#411b91)', 'L 5 (#8ceee2)', 'U 2 (#caa173)',
  'L 1 (#1b58a2)', 'U 2 (#caa171)', 'R 2 (#7807d2)', 'U 3 (#a77fa3)',
  'L 2 (#015232)', 'U 2 (#7a21e3)',
].join('\n');

function cmpBigInt(a: bigint, b: bigint): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function scanlineRowLength(polygon: LagoonPolygon, y: bigint, includeHoriz: boolean): bigint {
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
  crossings.sort(cmpBigInt);
  for (let i = 0; i < crossings.length; i += 2) {
    intervals.push(new ClosedInterval(crossings[i]!, crossings[i + 1]!));
  }
  return new IntervalUnion(intervals).totalLength;
}

function scanlineOracle(polygon: LagoonPolygon): bigint {
  const ySet = new Set<bigint>();
  for (const edge of polygon.edges) ySet.add(edge.start.y);
  const ys = Array.from(ySet).sort(cmpBigInt);
  let total = 0n;
  for (let i = 0; i < ys.length; i += 1) {
    const y = ys[i]!;
    total += scanlineRowLength(polygon, y, true);
    if (i + 1 < ys.length) {
      const gap = ys[i + 1]! - y - 1n;
      if (gap > 0n) total += scanlineRowLength(polygon, y + 1n, false) * gap;
    }
  }
  return total;
}

function buildMegaSquareInput(): string {
  const lines: string[] = [];
  const dirs: readonly [string, string][] = [
    ['R', 'fffff0'],
    ['D', 'fffff1'],
    ['L', 'fffff2'],
    ['U', 'fffff3'],
  ];
  for (const [d, hex] of dirs) {
    for (let i = 0; i < 100; i += 1) lines.push(`${d} 1 (#${hex})`);
  }
  return lines.join('\n');
}

describe('Day 18 Part 2 solver', () => {
  it('solves the official 14-step example to 952408144115n via executeSolver with a fake Clock', () => {
    let now = 50;
    const fakeClock: Clock = { nowMs: () => (now += 12) };
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(exec).toEqual({
      answer: 952408144115n,
      elapsedMs: 12,
      runtime: 'main-thread',
    });
  });

  it('produces sampled trace frames ending at complete polygon', () => {
    const polygon = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace?.(polygon, { maxSteps: 5 }) ?? [];
    expect(frames).toHaveLength(5);
    expect(frames[0]!.completedEdges).toBe(1);
    expect(frames[4]!.completedEdges).toBe(14);
    expect(frames[4]!.isComplete).toBe(true);
    expect(frames[4]!.cumulativeBoundary).toBe(6405262n);
    expect(frames[4]!.cumulativeSignedDoubleArea).toBe(1904809882966n);
  });

  it('maintains exact BigInt precision above Number.MAX_SAFE_INTEGER and finite SVG projection', () => {
    const polygon = solver.parse(buildMegaSquareInput());
    const volume = solver.solve(polygon);
    expect(volume > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(volume).toBe(10_995_095_515_965_001n);
    expect(volume).toBe(104_857_501n ** 2n);
    const projected = projectPolygonToSvg(polygon, { width: 640, height: 400, padding: 28 });
    for (const v of projected.vertices) {
      expect(Number.isFinite(v.x) && Number.isFinite(v.y)).toBe(true);
      expect(v.x >= 28 && v.x <= 612).toBe(true);
      expect(v.y >= 28 && v.y <= 372).toBe(true);
    }
  });

  it('matches independent BigInt scanline oracle across official, CW/CCW concave, and collinear loops', () => {
    const cwConcave = [
      'U 1 (#000060)', 'U 1 (#000021)', 'U 1 (#000042)', 'U 1 (#000031)',
      'U 1 (#000040)', 'U 1 (#000021)', 'U 1 (#000062)', 'U 1 (#000073)',
    ].join('\n');
    const ccwNegative = [
      'R 1 (#000042)', 'R 1 (#000051)', 'R 1 (#000020)', 'R 1 (#000023)',
      'R 1 (#000020)', 'R 1 (#000033)',
    ].join('\n');
    const collinear = [
      'L 1 (#000020)', 'L 1 (#000030)', 'L 1 (#000041)',
      'L 1 (#000052)', 'L 1 (#000013)', 'L 1 (#000033)',
    ].join('\n');

    for (const raw of [OFFICIAL_EXAMPLE, cwConcave, ccwNegative, collinear]) {
      const polygon = solver.parse(raw);
      expect(solver.solve(polygon)).toBe(scanlineOracle(polygon));
    }
  });

  it.each([
    ['invalid hex direction digit', 'R 1 (#000014)\nD 1 (#000011)\nL 1 (#000012)\nU 1 (#000013)', SyntaxError],
    ['zero hex distance', 'R 1 (#000000)\nD 1 (#000011)\nL 1 (#000012)\nU 1 (#000013)', RangeError],
    ['unclosed decoded loop', 'R 1 (#000010)\nD 1 (#000011)', Error],
    ['empty input', '   \n  ', Error],
  ])('rejects %s via solver.parse', (_label, raw, errType) => {
    expect(() => solver.parse(raw)).toThrow(errType);
  });
});
