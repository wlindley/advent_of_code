import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  parseCamelCardsDeal,
  traceCamelCardsDeal,
  type CamelCardsDeal,
  type CamelCardsTraceFrame,
} from '../../shared';
import { standardHandRule } from './rule';

/** Computes total Camel Cards winnings under Part 1 standard-jack rules. */
export function solveCamelCardsPart1(deal: CamelCardsDeal): bigint {
  return deal.totalWinningsWith(standardHandRule);
}

/** Produces bounded trace frames for a Part 1 Camel Cards deal. */
export function traceCamelCardsPart1(
  deal: CamelCardsDeal,
  options?: TraceOptions,
): readonly CamelCardsTraceFrame[] {
  return traceCamelCardsDeal(deal, standardHandRule, options);
}

/** Advent of Code 2023 Day 7 Part 1 solver ("Camel Cards"). */
export const solver: PuzzleSolver<CamelCardsDeal, bigint, CamelCardsTraceFrame> = Object.freeze({
  parse: parseCamelCardsDeal,
  solve: solveCamelCardsPart1,
  trace: traceCamelCardsPart1,
});
