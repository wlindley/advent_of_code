import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseScratchcards, type Scratchcard } from '../../shared';
import {
  CascadeTraceFrame,
  countTotalScratchcards,
  traceScratchcardCascade,
} from './cascade';

/** Pure TypeScript solver for Advent of Code 2023 Day 4 Part 2. */
export const solver: PuzzleSolver<readonly Scratchcard[], bigint, CascadeTraceFrame> = Object.freeze({
  parse(raw: string): readonly Scratchcard[] {
    return parseScratchcards(raw);
  },

  solve(cards: readonly Scratchcard[]): bigint {
    return countTotalScratchcards(cards);
  },

  trace(cards: readonly Scratchcard[], options?: TraceOptions): readonly CascadeTraceFrame[] {
    return traceScratchcardCascade(cards, options);
  },
});
