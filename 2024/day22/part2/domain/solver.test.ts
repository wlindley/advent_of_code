import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { PART2_LEADERBOARD_SIZE, PART2_STEPS, solvePart2, solver } from './index';

const PART2_EXAMPLE_INPUT = ['1', '2', '3', '2024'].join('\n');
const ORACLE_MOD = 16_777_216n;

class FakeClock implements Clock {
  private index = 0;

  constructor(private readonly readings: readonly number[]) {}

  nowMs(): number {
    const value = this.readings[this.index]!;
    this.index += 1;
    return value;
  }
}

function nextSecretBigInt(secret: bigint): bigint {
  let s = (secret ^ (secret << 6n)) % ORACLE_MOD;
  s = (s ^ (s >> 5n)) % ORACLE_MOD;
  return (s ^ (s << 11n)) % ORACLE_MOD;
}

function accumulateBuyerOracle(seed: number, steps: number, totals: Map<string, number>): void {
  let secret = BigInt(seed);
  let prev = Number(secret % 10n);
  const deltas: number[] = [];
  const seen = new Set<string>();
  for (let t = 1; t <= steps; t += 1) {
    secret = nextSecretBigInt(secret);
    const price = Number(secret % 10n);
    deltas.push(price - prev);
    prev = price;
    if (t >= 4) {
      const key = `${deltas[t - 4]},${deltas[t - 3]},${deltas[t - 2]},${deltas[t - 1]}`;
      if (!seen.has(key)) {
        seen.add(key);
        totals.set(key, (totals.get(key) ?? 0) + price);
      }
    }
  }
}

function oracleBestBananas(seeds: readonly number[], steps: number): number {
  const totals = new Map<string, number>();
  for (const seed of seeds) accumulateBuyerOracle(seed, steps, totals);
  let best = 0;
  for (const total of totals.values()) {
    if (total > best) best = total;
  }
  return best;
}

describe('Day 22 Part 2 solver', () => {
  it('self-checks the independent BigInt oracle on AoC 9-step walkthrough', () => {
    expect(oracleBestBananas([123], 9)).toBe(6);
  });

  it('solves the official Part 2 example (1, 2, 3, 2024) and matches the oracle', () => {
    expect(PART2_STEPS).toBe(2_000);
    expect(PART2_LEADERBOARD_SIZE).toBe(10);
    const seeds = solver.parse(PART2_EXAMPLE_INPUT);
    expect(seeds).toEqual([1, 2, 3, 2024]);
    const expected = oracleBestBananas(seeds, PART2_STEPS);
    expect(expected).toBe(23);
    expect(solvePart2(seeds)).toBe(23);
    expect(solver.solve(seeds)).toBe(23);
  });

  it('handles duplicate sequences within a buyer and duplicate buyers against the oracle', () => {
    const single = solvePart2([123]);
    expect(single).toBe(oracleBestBananas([123], PART2_STEPS));
    const doubled = solvePart2([123, 123]);
    expect(doubled).toBe(2 * single);
    expect(doubled).toBe(oracleBestBananas([123, 123], PART2_STEPS));
  });

  it('handles all-zero fixed-point buyer seeds', () => {
    expect(solvePart2([0])).toBe(0);
    expect(oracleBestBananas([0], PART2_STEPS)).toBe(0);
  });

  it('executes via executeSolver with deterministic clock timing', () => {
    const execution = executeSolver(solver, PART2_EXAMPLE_INPUT, new FakeClock([100, 142.5]));
    expect(execution.answer).toBe(23);
    expect(execution.elapsedMs).toBe(42.5);
    expect(execution.runtime).toBe('main-thread');
  });

  it('builds bounded optimization traces with leaderboard and matched price window', () => {
    const seeds = solver.parse(PART2_EXAMPLE_INPUT);
    const frames = solver.trace!(seeds);
    expect(frames).toHaveLength(5);
    const last = frames[frames.length - 1]!;
    expect(last.isComplete).toBe(true);
    expect(last.optimization?.maxBananas).toBe(23);
    expect(last.optimization?.bestCandidate?.deltas).toEqual([-2, 1, -1, 3]);
    const top = last.optimization!.topCandidates;
    expect(top.length).toBeLessThanOrEqual(PART2_LEADERBOARD_SIZE);
    for (let i = 1; i < top.length; i += 1) {
      expect(top[i]!.totalBananas).toBeLessThanOrEqual(top[i - 1]!.totalBananas);
    }
    expect(last.activeWindow.matchedPrice).toBe(9);
    expect(last.activeWindow.matchedDeltas).toEqual([-2, 1, -1, 3]);

    const bounded = solver.trace!(seeds, { maxSteps: 3 });
    expect(bounded).toHaveLength(3);
    expect(bounded[bounded.length - 1]!.isComplete).toBe(true);
    expect(bounded[bounded.length - 1]!.optimization?.maxBananas).toBe(23);
  });

  it('rejects empty, malformed, out-of-range inputs and invalid trace options', () => {
    for (const raw of ['', '   \n\t  ', '-5', '12.34', 'abc', '9007199254740992']) {
      expect(() => solver.parse(raw)).toThrow(RangeError);
    }
    expect(() => solver.trace!([])).toThrow(RangeError);
    expect(() => solver.trace!([1, 2, 3, 2024], { maxSteps: 0 })).toThrow(RangeError);
  });
});
