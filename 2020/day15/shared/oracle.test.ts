import { describe, expect, it } from 'vitest';
import { playMemoryGame } from './engine';
import { StartingSequence } from './model';
import { MemoryGameSolver } from './solver';

function naiveHistoryOracle(seeds: readonly number[], targetTurn: number): readonly number[] {
  const history: number[] = [];
  for (let turn = 1; turn <= targetTurn; turn += 1) {
    if (turn <= seeds.length) {
      history.push(seeds[turn - 1]!);
    } else {
      const considered = history[history.length - 1]!;
      const prevIdx = history.lastIndexOf(considered, history.length - 2);
      history.push(prevIdx === -1 ? 0 : history.length - 1 - prevIdx);
    }
  }
  return history;
}

function nextPrng(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function buildRandomSeeds(seed: number): readonly number[] {
  let rng = seed >>> 0;
  rng = nextPrng(rng);
  const length = 1 + (rng % 8);
  const values: number[] = [];
  for (let i = 0; i < length; i += 1) {
    rng = nextPrng(rng);
    values.push(rng % 500);
  }
  return values;
}

const OFFICIAL_SEEDS: readonly (readonly number[])[] = [
  [0, 3, 6],
  [1, 3, 2],
  [2, 1, 3],
  [1, 2, 3],
  [2, 3, 1],
  [3, 2, 1],
  [3, 1, 2],
];

const EDGE_SEEDS: readonly (readonly number[])[] = [
  [0],
  [3, 3],
  [5, 5, 5],
  [9999, 9999],
  [0, 100000],
];

describe('2020 Day 15 differential oracle tests', () => {
  it('matches naive lastIndexOf oracle across all 7 official examples at turn 120', () => {
    const target = 120;
    const solver = new MemoryGameSolver(target);
    for (const seeds of OFFICIAL_SEEDS) {
      const seq = new StartingSequence(seeds);
      const oracle = naiveHistoryOracle(seeds, target);
      expect(playMemoryGame(seq, target)).toBe(oracle[target - 1]);

      const frames = solver.trace(seq, { maxSteps: target });
      expect(frames.map((f) => f.spoken)).toEqual(oracle);
    }
  });

  it('matches naive lastIndexOf oracle across duplicate and overflow edge cases', () => {
    const target = 60;
    const solver = new MemoryGameSolver(target);
    for (const seeds of EDGE_SEEDS) {
      const seq = new StartingSequence(seeds);
      const oracle = naiveHistoryOracle(seeds, target);
      expect(playMemoryGame(seq, target)).toBe(oracle[target - 1]);

      const frames = solver.trace(seq, { maxSteps: target });
      expect(frames.map((f) => f.spoken)).toEqual(oracle);
    }
  });

  it('matches naive lastIndexOf oracle across 25 seeded PRNG starting sequences', () => {
    const target = 100;
    const solver = new MemoryGameSolver(target);
    for (let idx = 1; idx <= 25; idx += 1) {
      const seeds = buildRandomSeeds(idx * 97 + 13);
      const seq = new StartingSequence(seeds);
      const oracle = naiveHistoryOracle(seeds, target);
      expect(playMemoryGame(seq, target)).toBe(oracle[target - 1]);

      const frames = solver.trace(seq, { maxSteps: target });
      expect(frames[frames.length - 1]!.spoken).toBe(oracle[target - 1]);
    }
  });
});
