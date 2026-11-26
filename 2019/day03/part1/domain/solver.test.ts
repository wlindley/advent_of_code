import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import {
  SIGNAL_DELAY_METRIC,
  findCrossings,
  pickBestCrossing,
} from '../../shared';
import { solver } from './index';

const DIRS = ['U', 'D', 'L', 'R'] as const;

interface PrngState {
  seed: number;
}

function nextRand(state: PrngState): number {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed;
}

function generateWirePath(state: PrngState, count: number): string {
  const tokens: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const dir = DIRS[nextRand(state) % 4]!;
    const dist = (nextRand(state) % 6) + 1;
    tokens.push(`${dir}${dist}`);
  }
  return tokens.join(',');
}

function walkWireGrid(line: string): Map<string, number> {
  const visited = new Map<string, number>();
  let x = 0;
  let y = 0;
  let steps = 0;
  for (const token of line.split(',')) {
    const dir = token[0]!;
    const dist = Number(token.slice(1));
    const dx = dir === 'R' ? 1 : dir === 'L' ? -1 : 0;
    const dy = dir === 'U' ? 1 : dir === 'D' ? -1 : 0;
    for (let s = 0; s < dist; s += 1) {
      x += dx;
      y += dy;
      steps += 1;
      if (x !== 0 || y !== 0) {
        const key = `${x},${y}`;
        if (!visited.has(key)) visited.set(key, steps);
      }
    }
  }
  return visited;
}

function oracleMetrics(raw: string): { manhattan: bigint | null; delay: bigint | null } {
  const [line1, line2] = raw.split('\n');
  const first = walkWireGrid(line1!);
  const second = walkWireGrid(line2!);
  let minManhattan: bigint | null = null;
  let minDelay: bigint | null = null;
  for (const [key, s1] of first.entries()) {
    const s2 = second.get(key);
    if (s2 === undefined) continue;
    const [xs, ys] = key.split(',');
    const dist = BigInt(Math.abs(Number(xs)) + Math.abs(Number(ys)));
    const delay = BigInt(s1 + s2);
    if (minManhattan === null || dist < minManhattan) minManhattan = dist;
    if (minDelay === null || delay < minDelay) minDelay = delay;
  }
  return { manhattan: minManhattan, delay: minDelay };
}

describe('2019 Day 3 Part 1 solver', () => {
  it('solves all three official AoC examples via executeSolver and bounded trace', () => {
    const ex1 = 'R8,U5,L5,D3\nU7,R6,D4,L4';
    const ex2 = 'R75,D30,R83,U83,L12,D49,R71,U7,L72\nU62,R66,U55,R34,D71,R55,D58,R83';
    const ex3 =
      'R98,U47,R26,D63,R33,U87,L62,D20,R33,U53,R51\nU98,R91,D20,R16,D67,R40,U7,R15,U6,R7';

    expect(executeSolver(solver, ex1).answer).toBe(6n);
    expect(executeSolver(solver, ex2).answer).toBe(159n);
    expect(executeSolver(solver, ex3).answer).toBe(135n);

    const parsed = solver.parse(ex1);
    const fullTrace = solver.trace(parsed);
    expect(fullTrace).toHaveLength(4);
    expect(fullTrace[3]!.bestCrossing!.manhattanDistance).toBe(6n);

    const sampledTrace = solver.trace(parsed, { maxSteps: 2 });
    expect(sampledTrace).toHaveLength(2);
    expect(sampledTrace[1]!.bestCrossing!.manhattanDistance).toBe(6n);
  });

  it('matches independent grid-walk oracle across 30 seeded PRNG pairs for both metrics', () => {
    const state: PrngState = { seed: 20190301 };
    for (let trial = 0; trial < 30; trial += 1) {
      const raw = `${generateWirePath(state, 16)}\n${generateWirePath(state, 16)}`;
      const expected = oracleMetrics(raw);
      const pair = solver.parse(raw);
      const crossings = findCrossings(pair);
      if (expected.manhattan === null) {
        expect(() => solver.solve(pair)).toThrow();
        expect(pickBestCrossing(crossings, SIGNAL_DELAY_METRIC)).toBeNull();
      } else {
        expect(solver.solve(pair)).toBe(expected.manhattan);
        const bestDelay = pickBestCrossing(crossings, SIGNAL_DELAY_METRIC);
        expect(SIGNAL_DELAY_METRIC.score(bestDelay!)).toBe(expected.delay);
      }
    }
  });

  it('handles 10^20 BigInt distances and throws on zero-crossing or malformed input', () => {
    const d = '100000000000000000000';
    expect(executeSolver(solver, `R${d},U${d}\nU${d},R${d}`).answer).toBe(200000000000000000000n);
    expect(() => executeSolver(solver, 'R5,U5\nL5,D5')).toThrow('No wire crossings found');
    expect(() => solver.parse('R5,U5')).toThrow();
  });
});
