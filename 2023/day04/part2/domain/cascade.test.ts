import { describe, expect, it } from 'vitest';
import { parseScratchcards, Scratchcard } from '../../shared';
import {
  CascadeTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  countTotalScratchcards,
  traceScratchcardCascade,
} from './cascade';

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
  const owned = matches === 0 ? [999] : winners;
  return new Scratchcard(id, winners, owned);
}

describe('countTotalScratchcards', () => {
  it('returns 0n for an empty deck', () => {
    expect(countTotalScratchcards([])).toBe(0n);
  });

  it('handles a single card with 0 matches and with clamped k = 5', () => {
    expect(countTotalScratchcards([makeCard(1, 0)])).toBe(1n);
    expect(countTotalScratchcards([makeCard(1, 5)])).toBe(1n);
  });

  it('clamps cascades at the tail of a 3-card deck', () => {
    const cards = [makeCard(1, 5), makeCard(2, 5), makeCard(3, 5)];
    expect(countTotalScratchcards(cards)).toBe(7n);
    expect(traceScratchcardCascade(cards).map((f) => f.cardCopies)).toEqual([
      [1n, 2n, 2n],
      [1n, 2n, 4n],
      [1n, 2n, 4n],
    ]);
  });

  it('isolates cascades across zero-match firebreaks', () => {
    const cards = [2, 0, 0, 1, 0].map((m, idx) => makeCard(idx + 1, m));
    expect(countTotalScratchcards(cards)).toBe(8n);
    expect(traceScratchcardCascade(cards).at(-1)!.cardCopies).toEqual([1n, 2n, 2n, 1n, 2n]);
  });

  it('supports k = 60 without calling card.points and 65-card exponential cascade', () => {
    expect(countTotalScratchcards([makeCard(1, 60), makeCard(2, 0)])).toBe(3n);
    const expDeck = Array.from({ length: 65 }, (_, i) => makeCard(i + 1, 65));
    expect(countTotalScratchcards(expDeck)).toBe((1n << 65n) - 1n);
  });

  it('uses positional order even when card IDs are non-sequential', () => {
    const cards = [makeCard(10, 2), makeCard(42, 1), makeCard(99, 0)];
    expect(countTotalScratchcards(cards)).toBe(7n);
  });
});

describe('traceScratchcardCascade & CascadeTraceFrame', () => {
  it('returns a frozen empty array for empty input and validates maxSteps first', () => {
    const empty = traceScratchcardCascade([]);
    expect(empty).toEqual([]);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(() => traceScratchcardCascade([], { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceScratchcardCascade([], { maxSteps: -5 })).toThrow(RangeError);
    expect(() => traceScratchcardCascade([], { maxSteps: 1.5 })).toThrow(RangeError);
    expect(() => traceScratchcardCascade([], { maxSteps: Number.NaN })).toThrow(RangeError);
  });

  it('traces the official 6-card example with exact frozen snapshots and getters', () => {
    const frames = traceScratchcardCascade(parseScratchcards(EXAMPLE));
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames.map((f) => f.cardCopies)).toEqual([
      [1n, 2n, 2n, 2n, 2n, 1n],
      [1n, 2n, 4n, 4n, 2n, 1n],
      [1n, 2n, 4n, 8n, 6n, 1n],
      [1n, 2n, 4n, 8n, 14n, 1n],
      [1n, 2n, 4n, 8n, 14n, 1n],
      [1n, 2n, 4n, 8n, 14n, 1n],
    ]);
    expect(frames.map((f) => [f.activeCopies, f.matchCount, f.clampedEndIndex, f.clampedSpan, f.spawnedCopies, f.runningTotal, f.projectedTotal, f.peakCopies])).toEqual([
      [1n, 4, 4, 4, 4n, 1n, 10n, 2n],
      [2n, 2, 3, 2, 4n, 3n, 14n, 4n],
      [4n, 2, 4, 2, 8n, 7n, 22n, 8n],
      [8n, 1, 4, 1, 8n, 15n, 30n, 14n],
      [14n, 0, 4, 0, 0n, 29n, 30n, 14n],
      [1n, 0, 5, 0, 0n, 30n, 30n, 14n],
    ]);
    expect(frames[0]!.totalCards).toBe(6);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(Object.isFrozen(frames[0]!.cardCopies)).toBe(true);
  });

  it('rejects invalid CascadeTraceFrame inputs separately', () => {
    const card = makeCard(1, 1);
    expect(() => new CascadeTraceFrame(0, card, [])).toThrow(RangeError);
    expect(() => new CascadeTraceFrame(0, card, [1n, 0n])).toThrow(RangeError);
    expect(() => new CascadeTraceFrame(0, card, [-1n])).toThrow(RangeError);
    expect(() => new CascadeTraceFrame(1.5, card, [1n, 1n])).toThrow(RangeError);
    expect(() => new CascadeTraceFrame(Number.NaN, card, [1n])).toThrow(RangeError);
    expect(() => new CascadeTraceFrame(-1, card, [1n])).toThrow(RangeError);
    expect(() => new CascadeTraceFrame(2, card, [1n, 1n])).toThrow(RangeError);
  });

  it('samples large decks up to maxSteps while preserving final total', () => {
    const deck = Array.from({ length: 250 }, (_, i) => makeCard(i + 1, i % 4));
    const expected = countTotalScratchcards(deck);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    for (const maxSteps of [1, 3, 20, 200]) {
      const frames = traceScratchcardCascade(deck, { maxSteps });
      expect(frames.length).toBe(maxSteps);
      expect(frames.at(-1)!.cardIndex).toBe(249);
      expect(frames.at(-1)!.runningTotal).toBe(expected);
      if (maxSteps > 1) expect(frames[0]!.cardIndex).toBe(0);
    }
  });
});
