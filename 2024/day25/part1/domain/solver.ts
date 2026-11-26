import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type TumblerInventory,
  type TumblerTraceFrame,
  buildMatchTrace,
  countFittingPairs,
  parseSchematics,
} from '../../shared';

/** Counts all unique lock/key pairs that fit together without overlapping pins. */
export function solvePart1(inventory: TumblerInventory): number {
  return countFittingPairs(inventory);
}

export const solver: PuzzleSolver<TumblerInventory, number, TumblerTraceFrame> = Object.freeze({
  parse: (raw: string) => parseSchematics(raw),
  solve: (inventory: TumblerInventory) => solvePart1(inventory),
  trace: (inventory: TumblerInventory, options?: TraceOptions) => buildMatchTrace(inventory, options),
});
