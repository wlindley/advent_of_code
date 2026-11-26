import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import {
  AXIS_ALIGNED_POLICY,
  OCTILINEAR_POLICY,
  analyzeVentField,
  countVentOverlaps,
  traceVentField,
} from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = [
  '0,9 -> 5,9',
  '8,0 -> 0,8',
  '9,4 -> 3,4',
  '2,2 -> 2,1',
  '7,0 -> 7,4',
  '6,4 -> 2,0',
  '0,9 -> 2,9',
  '3,4 -> 1,4',
  '0,0 -> 8,8',
  '5,5 -> 8,2',
].join('\n');

const FIXED_CLOCK: Clock = Object.freeze({ nowMs: () => 42 });

function nextRand(state: { seed: number }, max: number): number {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed % max;
}

function oracleCountOverlaps(raw: string): number {
  const counts = new Map<string, number>();
  for (const line of raw.split('\n')) {
    const m = /^\s*(-?\d+),(-?\d+)\s*->\s*(-?\d+),(-?\d+)\s*$/.exec(line);
    if (!m) continue;
    const x1 = Number(m[1]), y1 = Number(m[2]), x2 = Number(m[3]), y2 = Number(m[4]);
    const dx = x2 - x1, dy = y2 - y1;
    if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) continue;
    const sx = Math.sign(dx), sy = Math.sign(dy);
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let k = 0; k <= steps; k += 1) {
      const key = `${x1 + k * sx},${y1 + k * sy}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let overlaps = 0;
  for (const count of counts.values()) if (count >= 2) overlaps += 1;
  return overlaps;
}

function buildRandomField(seed: number): string {
  const rng = { seed };
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 1], [0, 0]] as const;
  const lines: string[] = [];
  for (let i = 0; i < 18; i += 1) {
    const x1 = nextRand(rng, 21) - 10;
    const y1 = nextRand(rng, 21) - 10;
    const [dx, dy] = dirs[nextRand(rng, dirs.length)]!;
    const len = nextRand(rng, 6);
    lines.push(`${x1},${y1} -> ${x1 + dx * len},${y1 + dy * len}`);
  }
  return lines.join('\n');
}

describe('2021 Day 5 Part 2 solver', () => {
  it('solves the official example to 12 and produces full 10-frame trace', () => {
    const field = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(field)).toBe(12);
    const frames = solver.trace!(field);
    expect(frames).toHaveLength(10);
    expect(frames.every((frame) => frame.latestIncluded)).toBe(true);
    expect(frames[9]!.overlapCount).toBe(12);
    expect(frames[9]!.intenseCount).toBe(2);
    expect(frames[9]!.maxDepth).toBe(3);
  });

  it('handles exact diagonal crossings, 4-quadrant star, and half-lattice misses', () => {
    expect(solver.solve(solver.parse('1,1 -> 3,3\n3,1 -> 1,3'))).toBe(1);
    expect(solver.solve(solver.parse('9,7 -> 7,9\n8,7 -> 8,9'))).toBe(1);
    const star = solver.parse('0,0 -> 2,2\n4,0 -> 2,2\n0,4 -> 2,2\n4,4 -> 2,2');
    const starFrames = solver.trace!(star);
    expect(starFrames[3]!.overlapCount).toBe(1);
    expect(starFrames[3]!.intenseCount).toBe(1);
    expect(starFrames[3]!.maxDepth).toBe(4);
    expect(solver.solve(solver.parse('0,0 -> 1,1\n1,0 -> 0,1'))).toBe(0);
  });

  it('handles collinear diagonals, single-point, oblique decoys, negatives, and sparse fallback', () => {
    expect(solver.solve(solver.parse('1,1 -> 4,4\n5,5 -> 3,3'))).toBe(2);
    expect(solver.solve(solver.parse('0,2 -> 4,2\n1,1 -> 3,3'))).toBe(1);
    expect(solver.solve(solver.parse('2,2 -> 2,2\n2,2 -> 2,2'))).toBe(1);
    expect(solver.solve(solver.parse('0,0 -> 2,1\n0,1 -> 2,0'))).toBe(0);
    expect(solver.solve(solver.parse('-4,-4 -> 4,4\n4,-4 -> -4,4'))).toBe(1);
    const sparse = solver.parse('0,0 -> 3000,3000\n0,3000 -> 3000,0');
    expect(solver.solve(sparse)).toBe(1);
    expect(analyzeVentField(sparse, OCTILINEAR_POLICY).mode).toBe('sparse');
  });

  it('matches independent oracle across 40 seeded PRNG fields and dominates Part 1', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const raw = buildRandomField(seed * 7919);
      const field = solver.parse(raw);
      const actual = solver.solve(field);
      expect(actual).toBe(oracleCountOverlaps(raw));
      expect(actual).toBeGreaterThanOrEqual(countVentOverlaps(field, AXIS_ALIGNED_POLICY));
    }
  });

  it('supports bounded trace steps, validates bounds, and caps hotspots', () => {
    const field = solver.parse(EXAMPLE_INPUT);
    const four = solver.trace!(field, { maxSteps: 4 });
    expect(four.map((f) => f.stepIndex)).toEqual([0, 3, 6, 9]);
    expect(four[3]!.overlapCount).toBe(12);
    const one = solver.trace!(field, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.overlapCount).toBe(12);
    expect(() => solver.trace!(field, { maxSteps: 0 })).toThrow(RangeError);

    const capped = traceVentField(field, OCTILINEAR_POLICY, { maxHotspots: 2 });
    const stored = capped.reduce((sum, f) => sum + f.addedOverlaps.length + f.addedIntense.length, 0);
    expect(stored).toBeLessThanOrEqual(2);
    expect(capped[capped.length - 1]!.hotspotsTruncated).toBe(true);
  });

  it('integrates with executeSolver and propagates parse errors', () => {
    const res = executeSolver(solver, EXAMPLE_INPUT, FIXED_CLOCK);
    expect(res).toEqual({ answer: 12, elapsedMs: 0, runtime: 'main-thread' });
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('0,9 -> bad')).toThrow(SyntaxError);
    expect(() => solver.parse('99999999999999999,0 -> 0,0')).toThrow(RangeError);
  });
});
