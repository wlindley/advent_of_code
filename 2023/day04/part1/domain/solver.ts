import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseScratchcards, type Scratchcard } from '../../shared';
import {
  ScratchcardTraceFrame,
  sumScratchcardPoints,
  traceScratchcards,
} from './trace';

/** Pure TypeScript solver for Advent of Code 2023 Day 4 Part 1. */
export const solver: PuzzleSolver<readonly Scratchcard[], number, ScratchcardTraceFrame> = Object.freeze({
  parse(raw: string): readonly Scratchcard[] {
    return parseScratchcards(raw);
  },

  solve(cards: readonly Scratchcard[]): number {
    return sumScratchcardPoints(cards);
  },

  trace(cards: readonly Scratchcard[], options?: TraceOptions): readonly ScratchcardTraceFrame[] {
    return traceScratchcards(cards, options);
  },
});
