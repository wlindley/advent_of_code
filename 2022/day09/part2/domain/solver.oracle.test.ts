import { describe, expect, it } from 'vitest';
import { solver } from './index';

interface OraclePoint {
  x: number;
  y: number;
}

interface OracleResult {
  readonly count: number;
  readonly diagonalQuadrants: ReadonlySet<string>;
}

const ORACLE_DELTAS: Readonly<Record<string, readonly [number, number]>> = {
  U: [0, 1],
  D: [0, -1],
  L: [-1, 0],
  R: [1, 0],
};

const DIRS = ['U', 'D', 'L', 'R'] as const;

class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }
}

function followKnot(prev: OraclePoint, curr: OraclePoint, quadrants: Set<string>): void {
  const dx = prev.x - curr.x;
  const dy = prev.y - curr.y;
  if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return;
  if (Math.abs(dx) === 2 && Math.abs(dy) === 2) {
    quadrants.add(`${dx > 0 ? '+' : '-'}${dy > 0 ? '+' : '-'}`);
  }
  if (dx > 0) curr.x += 1;
  else if (dx < 0) curr.x -= 1;
  if (dy > 0) curr.y += 1;
  else if (dy < 0) curr.y -= 1;
}

function createOriginKnots(count: number): OraclePoint[] {
  const knots: OraclePoint[] = [];
  for (let i = 0; i < count; i += 1) knots.push({ x: 0, y: 0 });
  return knots;
}

function runOracle10(raw: string): OracleResult {
  const knots = createOriginKnots(10);
  const visited = new Set<string>(['0,0']);
  const diagonalQuadrants = new Set<string>();
  const lines = raw.replace(/\r\n/g, '\n').trim().split('\n');
  for (const line of lines) {
    const [dir, countText] = line.split(' ');
    const [dx, dy] = ORACLE_DELTAS[dir!]!;
    const steps = Number(countText);
    for (let s = 0; s < steps; s += 1) {
      knots[0]!.x += dx;
      knots[0]!.y += dy;
      for (let i = 1; i < 10; i += 1) followKnot(knots[i - 1]!, knots[i]!, diagonalQuadrants);
      const tail = knots[9]!;
      visited.add(`${tail.x},${tail.y}`);
    }
  }
  return { count: visited.size, diagonalQuadrants };
}

function generateMulberryPlan(seed: number): string {
  const rng = new Mulberry32(seed);
  const cmdCount = 12 + (rng.next() % 18);
  const lines: string[] = [];
  for (let i = 0; i < cmdCount; i += 1) {
    const dir = DIRS[rng.next() % 4]!;
    const steps = 1 + (rng.next() % 20);
    lines.push(`${dir} ${steps}`);
  }
  return lines.join('\n');
}

describe('2022 Day 9 Part 2 differential oracle', () => {
  const SMALL = ['R 4', 'U 4', 'L 3', 'D 1', 'R 4', 'D 1', 'L 5', 'R 2'].join('\n');
  const LARGE = ['R 5', 'U 8', 'L 8', 'D 3', 'R 17', 'D 10', 'L 25', 'U 20'].join('\n');

  it('agrees on official small (1) and large (36) examples', () => {
    expect(solver.solve(solver.parse(SMALL))).toBe(runOracle10(SMALL).count);
    expect(solver.solve(solver.parse(LARGE))).toBe(runOracle10(LARGE).count);
  });

  it('agrees on a multi-turn plan exercising all 4 (±2, ±2) diagonal quadrants', () => {
    const sweep = [
      'R 3', 'U 3', 'R 3', 'U 3',
      'R 3', 'D 3', 'R 3', 'D 3',
      'L 3', 'D 3', 'L 3', 'D 3',
      'L 3', 'U 3', 'L 3', 'U 3',
    ].join('\n');
    const oracle = runOracle10(sweep);
    expect(oracle.diagonalQuadrants.size).toBe(4);
    expect(solver.solve(solver.parse(sweep))).toBe(oracle.count);
  });

  it('agrees on negative-coordinate walks and sparse tracker fallback', () => {
    const negWalk = ['L 15', 'D 14', 'R 9', 'U 8', 'L 12', 'D 11'].join('\n');
    const sparseTurn = ['R 2100', 'U 2100'].join('\n');
    expect(solver.solve(solver.parse(negWalk))).toBe(runOracle10(negWalk).count);
    expect(solver.solve(solver.parse(sparseTurn))).toBe(runOracle10(sparseTurn).count);
  });

  it('agrees across 45 seeded Mulberry32 PRNG motion plans', () => {
    for (let seed = 1; seed <= 45; seed += 1) {
      const raw = generateMulberryPlan(seed * 9973);
      expect(solver.solve(solver.parse(raw))).toBe(runOracle10(raw).count);
    }
  });
});
