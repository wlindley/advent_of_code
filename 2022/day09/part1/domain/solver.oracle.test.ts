import { describe, expect, it } from 'vitest';
import { MotionPlan, countVisitedTailCells } from '../../shared';

interface MutablePt {
  x: number;
  y: number;
}

const DELTAS: Readonly<Record<string, readonly [number, number]>> = {
  U: [0, 1],
  D: [0, -1],
  L: [-1, 0],
  R: [1, 0],
};

function oracleCountTailVisits(raw: string, knotCount: number): number {
  const knots: MutablePt[] = Array.from({ length: knotCount }, () => ({ x: 0, y: 0 }));
  const visited = new Set<string>(['0,0']);
  const lines = raw.replace(/\r\n/g, '\n').trim().split('\n');
  for (const line of lines) {
    const [dir, countText] = line.split(' ');
    const [dx, dy] = DELTAS[dir!]!;
    const steps = Number(countText);
    for (let s = 0; s < steps; s += 1) {
      knots[0]!.x += dx;
      knots[0]!.y += dy;
      for (let i = 1; i < knotCount; i += 1) {
        const prev = knots[i - 1]!;
        const curr = knots[i]!;
        const gapX = prev.x - curr.x;
        const gapY = prev.y - curr.y;
        if (Math.abs(gapX) > 1 || Math.abs(gapY) > 1) {
          curr.x += gapX === 0 ? 0 : gapX > 0 ? 1 : -1;
          curr.y += gapY === 0 ? 0 : gapY > 0 ? 1 : -1;
        }
      }
      const tail = knots[knotCount - 1]!;
      visited.add(`${tail.x},${tail.y}`);
    }
  }
  return visited.size;
}

function makeSeededPlan(seed: number): string {
  const dirs = ['U', 'D', 'L', 'R'] as const;
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state;
  };
  const cmdCount = 10 + (next() % 16);
  const lines: string[] = [];
  for (let i = 0; i < cmdCount; i += 1) {
    const dir = dirs[next() % 4]!;
    const steps = 1 + (next() % 15);
    lines.push(`${dir} ${steps}`);
  }
  return lines.join('\n');
}

describe('Rope simulation oracle differential tests', () => {
  const SMALL = ['R 4', 'U 4', 'L 3', 'D 1', 'R 4', 'D 1', 'L 5', 'R 2'].join('\n');
  const LARGE = ['R 5', 'U 8', 'L 8', 'D 3', 'R 17', 'D 10', 'L 25', 'U 20'].join('\n');

  it('agrees on official small and large examples across K = 1, 2, 5, 10', () => {
    for (const raw of [SMALL, LARGE]) {
      const plan = MotionPlan.parse(raw);
      for (const k of [1, 2, 5, 10]) {
        expect(countVisitedTailCells(plan, k)).toBe(oracleCountTailVisits(raw, k));
      }
    }
  });

  it('agrees on (±2, ±2) diagonal cascades, negative walks, and sparse L-turns', () => {
    const diagCascade = ['R 2', 'U 2', 'R 2', 'U 2', 'L 4', 'D 4', 'L 2', 'D 2'].join('\n');
    const negWalk = ['L 12', 'D 9', 'R 4', 'U 3', 'L 5', 'D 7'].join('\n');
    const sparseTurn = ['R 5000', 'U 5000', 'L 10', 'D 10'].join('\n');

    for (const [raw, ks] of [
      [diagCascade, [3, 10]],
      [negWalk, [2, 10]],
      [sparseTurn, [2, 10]],
    ] as const) {
      const plan = MotionPlan.parse(raw);
      for (const k of ks) {
        expect(countVisitedTailCells(plan, k)).toBe(oracleCountTailVisits(raw, k));
      }
    }
  });

  it('agrees across 50 seeded PRNG motion plans for K = 1, 2, 3, 10', () => {
    const knotChoices = [1, 2, 3, 10] as const;
    for (let seed = 1; seed <= 50; seed += 1) {
      const raw = makeSeededPlan(seed * 7919);
      const plan = MotionPlan.parse(raw);
      const k = knotChoices[seed % knotChoices.length]!;
      expect(countVisitedTailCells(plan, k)).toBe(oracleCountTailVisits(raw, k));
    }
  });
});
