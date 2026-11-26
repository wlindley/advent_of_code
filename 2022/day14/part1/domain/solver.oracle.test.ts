import { describe, expect, it } from 'vitest';
import { parseCaveScan, simulateReservoir, SOURCE_X, SOURCE_Y } from '../../shared';
import { ABYSS_BOUNDARY_POLICY, solver } from './index';

function keyOf(x: number, y: number): string {
  return `${x},${y}`;
}

function addRockLines(scanRaw: string, occupied: Set<string>): number {
  const scan = parseCaveScan(scanRaw);
  for (const path of scan.paths) {
    for (let i = 0; i < path.points.length; i += 1) {
      const a = path.points[Math.max(0, i - 1)]!;
      const b = path.points[i]!;
      const x0 = Math.min(a.x, b.x);
      const x1 = Math.max(a.x, b.x);
      const y0 = Math.min(a.y, b.y);
      const y1 = Math.max(a.y, b.y);
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) occupied.add(keyOf(x, y));
      }
    }
  }
  return scan.maxY;
}

function naiveAbyssOracle(raw: string): Set<string> {
  const occupied = new Set<string>();
  const maxY = addRockLines(raw, occupied);
  const sand = new Set<string>();
  while (!occupied.has(keyOf(SOURCE_X, SOURCE_Y))) {
    let x = SOURCE_X;
    let y = SOURCE_Y;
    while (y <= maxY) {
      if (!occupied.has(keyOf(x, y + 1))) y += 1;
      else if (!occupied.has(keyOf(x - 1, y + 1))) { x -= 1; y += 1; }
      else if (!occupied.has(keyOf(x + 1, y + 1))) { x += 1; y += 1; }
      else { occupied.add(keyOf(x, y)); sand.add(keyOf(x, y)); break; }
    }
    if (y > maxY) break;
  }
  return sand;
}

function assertMatchesOracle(raw: string): void {
  const expected = naiveAbyssOracle(raw);
  const scan = solver.parse(raw);
  const field = simulateReservoir(scan, ABYSS_BOUNDARY_POLICY);
  expect(solver.solve(scan)).toBe(expected.size);
  const actual = new Set<string>();
  for (let i = 0; i < field.settledCount; i += 1) {
    const p = field.settledPointAt(i);
    actual.add(keyOf(p.x, p.y));
  }
  expect(actual).toEqual(expected);
}

function makeSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function randomCave(rng: () => number): string {
  const pathCount = 2 + Math.floor(rng() * 6);
  const lines: string[] = [];
  for (let p = 0; p < pathCount; p += 1) {
    let x = 486 + Math.floor(rng() * 29);
    let y = 1 + Math.floor(rng() * 14);
    const pts = [`${x},${y}`];
    const segs = 1 + Math.floor(rng() * 4);
    for (let s = 0; s < segs; s += 1) {
      if (rng() < 0.5) x += Math.floor(rng() * 13) - 6;
      else y = Math.max(0, y + Math.floor(rng() * 11) - 5);
      pts.push(`${x},${y}`);
    }
    lines.push(pts.join(' -> '));
  }
  return lines.join('\n');
}

describe('part1 differential oracle', () => {
  it('matches across official example and targeted edge topologies', () => {
    const cases = [
      '498,4 -> 498,6 -> 496,6\n503,4 -> 502,4 -> 502,9 -> 494,9',
      '500,0',
      '490,5 -> 495,5',
      '499,0 -> 499,2 -> 501,2 -> 501,0',
      '500,3',
      '497,3 -> 503,3\n495,6 -> 505,6',
      '496,2 -> 496,5 -> 504,5 -> 504,2',
      '450,4 -> 460,4\n499,4 -> 501,4',
      '-10,4 -> -5,4\n498,4 -> 502,4',
    ];
    for (const raw of cases) assertMatchesOracle(raw);
  });

  it('matches across 50 seeded random caves', () => {
    const rng = makeSeededRng(20221401);
    for (let i = 0; i < 50; i += 1) assertMatchesOracle(randomCave(rng));
  });
});
