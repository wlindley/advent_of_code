import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { countStonesAfterBlinks, validateBlinkCount } from './evolution';
import { parsePebbleLine, PebbleLine } from './pebbles';
import { tracePebbleEvolution, type PebbleTraceFrame } from './trace';

/** Builds a frozen PuzzleSolver for a fixed Plutonian Pebble blink count. */
export function createPlutonianPebblesSolver(
  blinkCount: number,
): PuzzleSolver<PebbleLine, bigint, PebbleTraceFrame> {
  const blinks = validateBlinkCount(blinkCount);
  return Object.freeze({
    parse: parsePebbleLine,
    solve: (line: PebbleLine): bigint => countStonesAfterBlinks(line, blinks),
    trace: (line: PebbleLine, options?: TraceOptions): readonly PebbleTraceFrame[] =>
      tracePebbleEvolution(line, blinks, options),
  });
}
