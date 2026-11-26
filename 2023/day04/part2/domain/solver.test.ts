import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { Scratchcard } from '../../shared';
import { solver } from './index';

const EXAMPLE = [
  'Card 1: 41 48 83 86 17 | 83 86  6 31 17  9 48 53',
  'Card 2: 13 32 20 16 61 | 61 30 68 82 17 32 24 19',
  'Card 3:  1 21 53 59 44 | 69 82 63 72 16 21 14  1',
  'Card 4: 41 92 73 84 69 | 59 84 76 51 58  5 54 83',
  'Card 5: 87 83 26 28 32 | 88 30 70 12 93 22 82 36',
  'Card 6: 31 18 13 56 72 | 74 77 10 23 35 67 36 11',
].join('\n');

function makeCard(id: number, matches: number): Scratchcard {
  const winners = Array.from({ length: Math.max(1, matches) }, (_, i) => i + 1);
  return new Scratchcard(id, winners, matches === 0 ? [999] : winners);
}

function forwardScatterDpOracle(cards: readonly Scratchcard[]): bigint {
  const counts = new Array<bigint>(cards.length).fill(1n);
  for (let i = 0; i < cards.length; i += 1) {
    const end = Math.min(cards.length - 1, i + cards[i]!.matchCount);
    for (let j = i + 1; j <= end; j += 1) {
      counts[j] = counts[j]! + counts[i]!;
    }
  }
  return counts.reduce((acc, c) => acc + c, 0n);
}

function backwardSuffixSumOracle(cards: readonly Scratchcard[]): bigint {
  const earned = new Array<bigint>(cards.length).fill(1n);
  for (let i = cards.length - 1; i >= 0; i -= 1) {
    const end = Math.min(cards.length - 1, i + cards[i]!.matchCount);
    let total = 1n;
    for (let j = i + 1; j <= end; j += 1) {
      total += earned[j]!;
    }
    earned[i] = total;
  }
  return earned.reduce((acc, c) => acc + c, 0n);
}

describe('2023 Day 04 Part 2 solver', () => {
  it('exposes a frozen PuzzleSolver and solves the official example to 30n', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    const cards = solver.parse(EXAMPLE);
    expect(solver.solve(cards)).toBe(30n);
    const frames = solver.trace!(cards);
    expect(frames).toHaveLength(6);
    expect(frames.at(-1)!.runningTotal).toBe(30n);
  });

  it('runs through executeSolver with an explicit fake Clock', () => {
    let ticks = 0;
    const fakeClock: Clock = { nowMs: () => (++ticks === 1 ? 100 : 107.5) };
    const result = executeSolver(solver, EXAMPLE, fakeClock);
    expect(result).toEqual({ answer: 30n, elapsedMs: 7.5, runtime: 'main-thread' });
  });

  it('matches forward scatter DP and backward suffix-sum oracles across stress decks', () => {
    const synthetic = Array.from({ length: 250 }, (_, i) => makeCard(i + 1, (i * 7 + 3) % 11));
    const allZero = Array.from({ length: 40 }, (_, i) => makeCard(i + 1, 0));
    const tailClamped = Array.from({ length: 30 }, (_, i) => makeCard(i + 1, 50));
    const exponential70 = Array.from({ length: 70 }, (_, i) => makeCard(i + 1, 70));
    for (const deck of [synthetic, allZero, tailClamped, exponential70]) {
      const actual = solver.solve(deck);
      expect(actual).toBe(forwardScatterDpOracle(deck));
      expect(actual).toBe(backwardSuffixSumOracle(deck));
    }
    expect(solver.solve(exponential70)).toBe((1n << 70n) - 1n);
  });
});
