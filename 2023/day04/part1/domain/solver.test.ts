import { describe, expect, it } from 'vitest';
import { bitCount, executeSolver } from '../../../../shared/core';
import { Scratchcard } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  ScratchcardTraceFrame,
  addSafePoints,
  solver,
  sumScratchcardPoints,
  traceScratchcards,
} from './index';

const EXAMPLE_INPUT = `Card 1: 41 48 83 86 17 | 83 86  6 31 17  9 48 53
Card 2: 13 32 20 16 61 | 61 30 68 82 17 32 24 19
Card 3:  1 21 53 59 44 | 69 82 63 72 16 21 14  1
Card 4: 41 92 73 84 69 | 59 84 76 51 58  5 54 83
Card 5: 87 83 26 28 32 | 88 30 70 12 93 22 82 36
Card 6: 31 18 13 56 72 | 74 77 10 23 35 67 36 11`;

function bigintBitsetOracle(cards: readonly Scratchcard[]): number {
  let total = 0;
  for (const card of cards) {
    let winMask = 0n;
    for (const w of card.winningNumbers) winMask |= 1n << BigInt(w);
    let ownMask = 0n;
    for (const o of card.ownedNumbers) ownMask |= 1n << BigInt(o);
    const matches = bitCount(winMask & ownMask);
    if (matches > 0) total += 2 ** (matches - 1);
  }
  return total;
}

function sortedTwoPointerOracle(cards: readonly Scratchcard[]): number {
  let total = 0;
  for (const card of cards) {
    const win = card.winningNumbers.slice().sort((a, b) => a - b);
    const own = card.ownedNumbers.slice().sort((a, b) => a - b);
    let wi = 0;
    let oi = 0;
    let matches = 0;
    while (wi < win.length && oi < own.length) {
      if (win[wi]! === own[oi]!) {
        matches += 1;
        oi += 1;
        while (wi + 1 < win.length && win[wi + 1]! === win[wi]!) wi += 1;
        wi += 1;
      } else if (win[wi]! < own[oi]!) {
        wi += 1;
      } else {
        oi += 1;
      }
    }
    if (matches > 0) total += 2 ** (matches - 1);
  }
  return total;
}

function buildSyntheticCards(count: number): string {
  let seed = 0x20230401;
  const lines: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const pool = Array.from({ length: 60 }, (_, idx) => idx + 1);
    for (let j = pool.length - 1; j > 0; j -= 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const k = seed % (j + 1);
      [pool[j], pool[k]] = [pool[k]!, pool[j]!];
    }
    const win = pool.slice(0, 10);
    for (let j = pool.length - 1; j > 0; j -= 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const k = seed % (j + 1);
      [pool[j], pool[k]] = [pool[k]!, pool[j]!];
    }
    const own = pool.slice(0, 20);
    lines.push(`Card ${String(i + 1).padStart(3, ' ')}: ${win.join(' ')} | ${own.join(' ')}`);
  }
  return lines.join('\n');
}

describe('2023 day 04 part 1 solver', () => {
  it('solves the official example to 13 directly and via executeSolver with fake Clock', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    const cards = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(cards)).toBe(13);

    let tick = 50;
    const exec = executeSolver(solver, EXAMPLE_INPUT, { nowMs: () => (tick += 9) });
    expect(exec).toEqual({ answer: 13, elapsedMs: 9, runtime: 'main-thread' });
  });

  it('handles empty card list and detects safe-integer overflow on k = 53 + k = 53', () => {
    expect(sumScratchcardPoints([])).toBe(0);
    const emptyFrames = traceScratchcards([]);
    expect(Object.isFrozen(emptyFrames)).toBe(true);
    expect(emptyFrames).toEqual([]);

    expect(addSafePoints(10, 5)).toBe(15);
    expect(() => addSafePoints(2 ** 52, 2 ** 52)).toThrow(RangeError);

    const seq53 = Array.from({ length: 53 }, (_, i) => i + 1);
    const overflowCards = [new Scratchcard(1, seq53, seq53), new Scratchcard(2, seq53, seq53)];
    expect(() => sumScratchcardPoints(overflowCards)).toThrow(RangeError);
    expect(() => traceScratchcards(overflowCards)).toThrow(RangeError);
  });

  it('emits frozen trace frames with dynamic getters and supports sampling and invalid maxSteps', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const cards = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(cards);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(6);

    const frame1 = frames[0]!;
    expect(frame1).toBeInstanceOf(ScratchcardTraceFrame);
    expect(Object.isFrozen(frame1)).toBe(true);
    expect(frame1.cardIndex).toBe(0);
    expect(frame1.totalCards).toBe(6);
    expect(frame1.matchingNumbers).toEqual([83, 86, 17, 48]);
    expect(frame1.matchCount).toBe(4);
    expect(frame1.cardPoints).toBe(8);
    expect(frame1.runningTotal).toBe(8);
    expect(frame1.winningCardCount).toBe(1);

    const last = frames[5]!;
    expect(last.matchCount).toBe(0);
    expect(last.cardPoints).toBe(0);
    expect(last.runningTotal).toBe(13);
    expect(last.winningCardCount).toBe(4);

    expect(() => traceScratchcards(cards, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceScratchcards(cards, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => traceScratchcards(cards, { maxSteps: 1.5 })).toThrow(RangeError);

    const manyCards = solver.parse(buildSyntheticCards(250));
    const expectedTotal = sumScratchcardPoints(manyCards);
    for (const maxSteps of [3, 20, 1, 200]) {
      const sampled = traceScratchcards(manyCards, { maxSteps });
      expect(sampled).toHaveLength(maxSteps);
      expect(sampled.at(-1)?.runningTotal).toBe(expectedTotal);
      expect(sampled.at(-1)?.cardIndex).toBe(249);
      if (maxSteps > 1) expect(sampled[0]!.cardIndex).toBe(0);
    }
  });

  it('matches both bigintBitsetOracle and sortedTwoPointerOracle across 250 synthetic cards', () => {
    const cards = solver.parse(buildSyntheticCards(250));
    const actual = solver.solve(cards);
    expect(actual).toBe(bigintBitsetOracle(cards));
    expect(actual).toBe(sortedTwoPointerOracle(cards));
  });
});
