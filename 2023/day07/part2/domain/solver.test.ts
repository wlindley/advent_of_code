import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { HandType } from '../../shared';
import { jokerHandRule } from './rule';
import { solveCamelCardsPart2, solver, traceCamelCardsPart2 } from './solver';

const EXAMPLE_INPUT = [
  '32T3K 765',
  'T55J5 684',
  'KK677 28',
  'KTJJT 220',
  'QQQJA 483',
].join('\n');

describe('2023 Day 7 Part 2 solver', () => {
  it('solves the official 5-hand example to 5905n with exact rank ordering', () => {
    const deal = solver.parse(EXAMPLE_INPUT);
    expect(solveCamelCardsPart2(deal)).toBe(5905n);
    expect(deal.rankWith(jokerHandRule).map((r) => r.hand.label)).toEqual([
      '32T3K',
      'KK677',
      'T55J5',
      'QQQJA',
      'KTJJT',
    ]);
  });

  it('orders AAAAK < JJJJJ < JJJJ2 < 22222 and JKKK2 < QQQQ2', () => {
    const deal = solver.parse('22222 1\nJJJJ2 1\nJJJJJ 1\nAAAAK 1');
    const ranked = deal.rankWith(jokerHandRule);
    expect(ranked.map((r) => r.hand.label)).toEqual(['AAAAK', 'JJJJJ', 'JJJJ2', '22222']);
    expect(ranked[1]!.handType).toBe(HandType.FiveOfAKind);

    const fourKind = solver.parse('QQQQ2 10\nJKKK2 20');
    expect(fourKind.rankWith(jokerHandRule).map((r) => r.hand.label)).toEqual(['JKKK2', 'QQQQ2']);
    expect(solveCamelCardsPart2(fourKind)).toBe(40n);
  });

  it('preserves inputIndex order on duplicate hands and handles single, zero, and huge bids', () => {
    const dupes = solver.parse('JJJJJ 100\nJJJJJ 5');
    const rankedDupes = dupes.rankWith(jokerHandRule);
    expect(rankedDupes.map((r) => r.hand.inputIndex)).toEqual([0, 1]);
    expect(solveCamelCardsPart2(dupes)).toBe(110n);

    expect(solveCamelCardsPart2(solver.parse('23456 42'))).toBe(42n);
    expect(solveCamelCardsPart2(solver.parse('23456 0\nAAAAA 0'))).toBe(0n);
    const huge = 1n << 65n;
    expect(solveCamelCardsPart2(solver.parse(`23456 1\nAAAAA ${huge}`))).toBe(1n + huge * 2n);
  });

  it('rejects empty, malformed, invalid card, and negative bid inputs separately', () => {
    expect(() => solver.parse('   \n  ')).toThrow(SyntaxError);
    expect(() => solver.parse('32T3K')).toThrow(SyntaxError);
    expect(() => solver.parse('32T3 10')).toThrow(RangeError);
    expect(() => solver.parse('32T3X 10')).toThrow(RangeError);
    expect(() => solver.parse('32T3K -5')).toThrow(SyntaxError);
  });

  it('produces bounded traces with tieBreakIndex and executes via fake Clock', () => {
    const frames = traceCamelCardsPart2(solver.parse(EXAMPLE_INPUT), { maxSteps: 3 });
    expect(frames.length).toBe(3);
    expect(frames[2]!.runningWinnings).toBe(5905n);

    const tieFrames = solver.trace!(solver.parse('QQQQ2 10\nJKKK2 20'));
    expect(tieFrames[1]!.tieBreakIndex).toBe(0);

    let tick = 50;
    const fakeClock: Clock = { nowMs: () => (tick += 7) };
    const result = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(result.answer).toBe(5905n);
    expect(result.elapsedMs).toBe(7);
  });
});
