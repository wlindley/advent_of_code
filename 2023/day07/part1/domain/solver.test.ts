import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { HandType } from '../../shared';
import { solveCamelCardsPart1, solver } from './solver';
import { standardHandRule } from './rule';

const EXAMPLE_INPUT = [
  '32T3K 765',
  'T55J5 684',
  'KK677 28',
  'KTJJT 220',
  'QQQJA 483',
].join('\n');

describe('2023 Day 7 Part 1 solver', () => {
  it('solves the official 5-hand example to 6440n with exact rank ordering', () => {
    const deal = solver.parse(EXAMPLE_INPUT);
    expect(solveCamelCardsPart1(deal)).toBe(6440n);
    const ranked = deal.rankWith(standardHandRule);
    expect(ranked.map((r) => r.hand.label)).toEqual([
      '32T3K',
      'KTJJT',
      'KK677',
      'T55J5',
      'QQQJA',
    ]);
  });

  it('orders same-type hands by first differing card and keeps JJJJJ as FiveOfAKind', () => {
    const fourKindDeal = solver.parse('2AAAA 10\n33332 20');
    expect(fourKindDeal.rankWith(standardHandRule).map((r) => r.hand.label)).toEqual([
      '2AAAA',
      '33332',
    ]);
    expect(solveCamelCardsPart1(fourKindDeal)).toBe(50n);

    const fullHouseDeal = solver.parse('77788 10\n77888 20');
    expect(fullHouseDeal.rankWith(standardHandRule).map((r) => r.hand.label)).toEqual([
      '77788',
      '77888',
    ]);

    const allJacks = solver.parse('JJJJJ 7\nAAAAK 5');
    const ranked = allJacks.rankWith(standardHandRule);
    expect(ranked[1]!.handType).toBe(HandType.FiveOfAKind);
    expect(ranked[1]!.hand.label).toBe('JJJJJ');
  });

  it('produces bounded traces and executes cleanly via executeSolver', () => {
    const deal = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(deal, { maxSteps: 3 });
    expect(frames.length).toBe(3);
    expect(frames[2]!.runningWinnings).toBe(6440n);

    let tick = 100;
    const fakeClock: Clock = { nowMs: () => (tick += 12) };
    const result = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(result.answer).toBe(6440n);
    expect(result.elapsedMs).toBe(12);
  });
});
