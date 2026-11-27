import { describe, expect, it } from 'vitest';
import { VALID_VELOCITY_COUNT_POLICY } from '../../shared';
import { solver } from './index';

interface PrngState {
  seed: number;
}

function nextSeededInt(state: PrngState, min: number, max: number): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return min + (state.seed % (max - min + 1));
}

function hitsTarget(
  vx0: number,
  vy0: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): boolean {
  let x = 0;
  let y = 0;
  let vx = vx0;
  let vy = vy0;
  while (x <= xMax && y >= yMin) {
    if (x >= xMin && y <= yMax) return true;
    x += vx;
    y += vy;
    if (vx > 0) vx -= 1;
    vy -= 1;
  }
  return false;
}

function bruteForceValidCount(xMin: number, xMax: number, yMin: number, yMax: number): number {
  let count = 0;
  const vyMax = -yMin - 1;
  for (let vx = 1; vx <= xMax; vx += 1) {
    for (let vy = yMin; vy <= vyMax; vy += 1) {
      if (hitsTarget(vx, vy, xMin, xMax, yMin, yMax)) count += 1;
    }
  }
  return count;
}

function formatTarget(xMin: number, xMax: number, yMin: number, yMax: number): string {
  return `target area: x=${xMin}..${xMax}, y=${yMin}..${yMax}`;
}

describe('2021 Day 17 Part 2 solver', () => {
  it('binds VALID_VELOCITY_COUNT_POLICY and solves official example 112', () => {
    expect(solver.policy).toBe(VALID_VELOCITY_COUNT_POLICY);
    const target = solver.parse('target area: x=20..30, y=-10..-5');
    const answer = solver.solve(target);
    expect(answer).toBe(112);
    expect(solver.formatAnswer(answer)).toBe('112');
  });

  it('matches independent brute force on boundary, stalling, gap, and overlap boxes', () => {
    const cases: readonly [number, number, number, number, number?][] = [
      [1, 1, -1, -1, 2],
      [5, 5, -2, -2, 1],
      [14, 14, -10, -2, 12],
      [6, 6, -3, -3, 3],
      [14, 15, -6, -3],
      [6, 10, -3, -1],
    ];
    for (const [xMin, xMax, yMin, yMax, expected] of cases) {
      const bf = bruteForceValidCount(xMin, xMax, yMin, yMax);
      if (expected !== undefined) expect(bf).toBe(expected);
      const actual = solver.solve(solver.parse(formatTarget(xMin, xMax, yMin, yMax)));
      expect(actual).toBe(bf);
    }
  });

  it('matches brute force across 28 seeded PRNG target boxes', () => {
    const rng: PrngState = { seed: 20211702 };
    for (let i = 0; i < 28; i += 1) {
      const xMin = nextSeededInt(rng, 1, 35);
      const xMax = xMin + nextSeededInt(rng, 0, 15);
      const yMax = -nextSeededInt(rng, 1, 15);
      const yMin = yMax - nextSeededInt(rng, 0, 15);
      const target = solver.parse(formatTarget(xMin, xMax, yMin, yMax));
      expect(solver.solve(target)).toBe(bruteForceValidCount(xMin, xMax, yMin, yMax));
    }
  });

  it('produces bounded monotonic sweep-and-arc trace frames', () => {
    const target = solver.parse('target area: x=20..30, y=-10..-5');
    const frames = solver.trace(target, { maxSteps: 12 });
    expect(frames).toHaveLength(12);
    expect(frames[0]!.phase).toBe('sweep');
    for (let i = 1; i < frames.length; i += 1) {
      expect(frames[i]!.activeResult).toBeGreaterThanOrEqual(frames[i - 1]!.activeResult);
    }
    const last = frames[11]!;
    expect(last.phase).toBe('arc');
    expect(last.isComplete).toBe(true);
    expect(last.activeResult).toBe(112);

    const single = solver.trace(target, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.isComplete).toBe(true);
    expect(single[0]!.activeResult).toBe(112);

    const deep = solver.trace(solver.parse('target area: x=20..30, y=-120..-60'));
    expect(deep.length).toBeLessThanOrEqual(48);
    expect(deep[deep.length - 1]!.isComplete).toBe(true);
  });

  it('rejects malformed syntax, out-of-range coordinates, and invalid trace options', () => {
    const invalidInputs: readonly string[] = [
      'x=20..30, y=-10..-5',
      'target area: x=0..5, y=-5..-1',
      'target area: x=10..5, y=-5..-1',
      'target area: x=1..100001, y=-5..-1',
      'target area: x=1..5, y=-5..0',
      'target area: x=1..5, y=-1..-5',
      'target area: x=1..5, y=-100001..-1',
    ];
    for (const raw of invalidInputs) {
      expect(() => solver.parse(raw)).toThrow();
    }
    const valid = solver.parse('target area: x=20..30, y=-10..-5');
    expect(() => solver.trace(valid, { maxSteps: 0 })).toThrow(RangeError);
  });
});
