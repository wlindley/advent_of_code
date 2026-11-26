import { describe, expect, it } from 'vitest';
import { parseCaveScan, simulateReservoir, SOURCE_X, SOURCE_Y } from '../../shared';
import { FLOOR_BOUNDARY_POLICY, solver } from './index';

const EXAMPLE = '498,4 -> 498,6 -> 496,6\n503,4 -> 502,4 -> 502,9 -> 494,9';

class SeededRng {
  #state: number;

  constructor(seed: number) {
    this.#state = seed >>> 0;
  }

  next(): number {
    this.#state = (Math.imul(1664525, this.#state) + 1013904223) >>> 0;
    return this.#state / 0x100000000;
  }

  nextInt(min: number, span: number): number {
    return min + Math.floor(this.next() * span);
  }
}

function keyOf(x: number, y: number): string {
  return `${x},${y}`;
}

function addRockLines(raw: string, rocks: Set<string>): number {
  const scan = parseCaveScan(raw);
  const floorY = scan.maxY + 2;
  const minX = SOURCE_X - floorY;
  const maxX = SOURCE_X + floorY;
  for (const path of scan.paths) {
    for (let i = 0; i < path.points.length; i += 1) {
      const a = path.points[Math.max(0, i - 1)]!;
      const b = path.points[i]!;
      const x0 = Math.max(minX, Math.min(a.x, b.x));
      const x1 = Math.min(maxX, Math.max(a.x, b.x));
      const y0 = Math.min(a.y, b.y);
      const y1 = Math.max(a.y, b.y);
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) rocks.add(keyOf(x, y));
      }
    }
  }
  return floorY;
}

function reachabilityDpOracle(raw: string): Set<string> {
  const rocks = new Set<string>();
  const floorY = addRockLines(raw, rocks);
  const sand = new Set<string>();
  if (rocks.has(keyOf(SOURCE_X, SOURCE_Y))) return sand;
  sand.add(keyOf(SOURCE_X, SOURCE_Y));
  for (let y = 1; y < floorY; y += 1) {
    for (let x = SOURCE_X - y; x <= SOURCE_X + y; x += 1) {
      const k = keyOf(x, y);
      if (rocks.has(k)) continue;
      if (sand.has(keyOf(x - 1, y - 1)) || sand.has(keyOf(x, y - 1)) || sand.has(keyOf(x + 1, y - 1))) {
        sand.add(k);
      }
    }
  }
  return sand;
}

function assertMatchesOracle(raw: string): Set<string> {
  const expected = reachabilityDpOracle(raw);
  const scan = solver.parse(raw);
  const field = simulateReservoir(scan, FLOOR_BOUNDARY_POLICY);
  expect(solver.solve(scan)).toBe(expected.size);
  const actual = new Set<string>();
  for (let i = 0; i < field.settledCount; i += 1) {
    const p = field.settledPointAt(i);
    actual.add(keyOf(p.x, p.y));
  }
  expect(actual).toEqual(expected);
  return actual;
}

function randomCave(rng: SeededRng): string {
  const pathCount = rng.nextInt(2, 6);
  const lines: string[] = [];
  for (let p = 0; p < pathCount; p += 1) {
    let x = rng.nextInt(486, 29);
    let y = rng.nextInt(1, 14);
    const pts = [`${x},${y}`];
    const segs = rng.nextInt(1, 4);
    for (let s = 0; s < segs; s += 1) {
      if (rng.next() < 0.5) x += rng.nextInt(-6, 13);
      else y = Math.max(0, y + rng.nextInt(-5, 11));
      pts.push(`${x},${y}`);
    }
    lines.push(pts.join(' -> '));
  }
  return lines.join('\n');
}

describe('part2 differential oracle', () => {
  it('verifies official example count and key pocket/floor coordinates', () => {
    const sand = assertMatchesOracle(EXAMPLE);
    expect(sand.size).toBe(93);
    expect(sand.has('500,0')).toBe(true);
    expect(sand.has('497,7')).toBe(false);
    for (let x = 495; x <= 501; x += 1) {
      expect(sand.has(keyOf(x, 10))).toBe(false);
    }
  });

  it('matches targeted edge topologies', () => {
    const cases = [
      '500,0',
      '1000,0',
      '-10,4 -> -5,4',
      '499,0',
      '495,2 -> 505,2\n490,5 -> 490,5',
    ];
    for (const raw of cases) assertMatchesOracle(raw);
  });

  it('matches across 50 seeded random caves', () => {
    const rng = new SeededRng(20221402);
    for (let i = 0; i < 50; i += 1) assertMatchesOracle(randomCave(rng));
  });
});
