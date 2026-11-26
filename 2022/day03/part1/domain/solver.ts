import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import {
  DEFAULT_MAX_TRACE_STEPS,
  parseRucksacks,
  PRIORITY_COUNT,
  PriorityTally,
  Rucksack,
} from '../../shared';

export interface RucksackTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly rucksackIndex: number;
  readonly totalRucksacks: number;
  readonly rucksack: Rucksack;
  readonly tally: PriorityTally;
}

function assertNonEmptyRucksacks(rucksacks: readonly Rucksack[]): void {
  if (rucksacks.length === 0) {
    throw new RangeError('Rucksack list must contain at least one rucksack');
  }
}

function buildTraceFrame(
  stepIndex: number,
  totalSteps: number,
  rucksackIndex: number,
  totalRucksacks: number,
  rucksack: Rucksack,
  counts: readonly number[],
): RucksackTraceFrame {
  return Object.freeze({
    stepIndex,
    totalSteps,
    rucksackIndex,
    totalRucksacks,
    rucksack,
    tally: new PriorityTally(counts),
  });
}

/** Sums the misplaced-item priority across every rucksack. */
export function solvePart1(rucksacks: readonly Rucksack[]): number {
  assertNonEmptyRucksacks(rucksacks);
  let total = 0;
  for (const rucksack of rucksacks) {
    total += rucksack.misplacedPriority;
  }
  return total;
}

/** Simulates all rucksacks and emits up to `maxSteps` bounded cumulative trace frames. */
export function tracePart1(
  rucksacks: readonly Rucksack[],
  options?: TraceOptions,
): readonly RucksackTraceFrame[] {
  assertNonEmptyRucksacks(rucksacks);
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(rucksacks.length, maxSteps);
  const counts = new Array<number>(PRIORITY_COUNT).fill(0);
  const frames: RucksackTraceFrame[] = [];
  let sampleCursor = 0;

  for (let i = 0; i < rucksacks.length; i += 1) {
    const rucksack = rucksacks[i]!;
    const slot = rucksack.misplacedPriority - 1;
    counts[slot] = counts[slot]! + 1;
    if (sampled[sampleCursor] === i) {
      frames.push(buildTraceFrame(sampleCursor, sampled.length, i, rucksacks.length, rucksack, counts));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<readonly Rucksack[], number, RucksackTraceFrame> = {
  parse: parseRucksacks,
  solve: solvePart1,
  trace: tracePart1,
};
