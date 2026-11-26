import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  parseCamelCardsDeal,
  traceCamelCardsDeal,
  type CamelCardsDeal,
  type CamelCardsTraceFrame,
} from '../../shared';
import { jokerHandRule } from './rule';

/** Computes total Camel Cards winnings under Part 2 wild-joker rules. */
export function solveCamelCardsPart2(deal: CamelCardsDeal): bigint {
  return deal.totalWinningsWith(jokerHandRule);
}

/** Produces bounded trace frames for a Part 2 Camel Cards deal. */
export function traceCamelCardsPart2(
  deal: CamelCardsDeal,
  options?: TraceOptions,
): readonly CamelCardsTraceFrame[] {
  return traceCamelCardsDeal(deal, jokerHandRule, options);
}

/** Advent of Code 2023 Day 7 Part 2 solver ("Camel Cards — Jokers"). */
export const solver: PuzzleSolver<CamelCardsDeal, bigint, CamelCardsTraceFrame> = Object.freeze({
  parse: parseCamelCardsDeal,
  solve: solveCamelCardsPart2,
  trace: traceCamelCardsPart2,
});
