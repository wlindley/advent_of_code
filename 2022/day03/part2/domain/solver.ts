import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PRIORITY_COUNT,
  PriorityTally,
} from '../../shared';
import { parseElfGroups, type ElfGroup } from './elfGroup';

export interface ElfGroupTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly groupIndex: number;
  readonly totalGroups: number;
  readonly group: ElfGroup;
  readonly tally: PriorityTally;
}

function assertNonEmptyGroups(groups: readonly ElfGroup[]): void {
  if (groups.length === 0) {
    throw new RangeError('ElfGroup list must contain at least one group');
  }
}

function buildTraceFrame(
  stepIndex: number,
  totalSteps: number,
  groupIndex: number,
  totalGroups: number,
  group: ElfGroup,
  counts: readonly number[],
): ElfGroupTraceFrame {
  return Object.freeze({
    stepIndex,
    totalSteps,
    groupIndex,
    totalGroups,
    group,
    tally: new PriorityTally(counts),
  });
}

/** Sums the unique 3-elf badge priority across every group. */
export function solvePart2(groups: readonly ElfGroup[]): number {
  assertNonEmptyGroups(groups);
  let total = 0;
  for (const group of groups) {
    total += group.badgePriority;
  }
  return total;
}

/** Simulates all elf groups and emits up to `maxSteps` bounded cumulative trace frames. */
export function tracePart2(
  groups: readonly ElfGroup[],
  options?: TraceOptions,
): readonly ElfGroupTraceFrame[] {
  assertNonEmptyGroups(groups);
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(groups.length, maxSteps);
  const counts = new Array<number>(PRIORITY_COUNT).fill(0);
  const frames: ElfGroupTraceFrame[] = [];
  let sampleCursor = 0;

  for (let i = 0; i < groups.length; i += 1) {
    const group = groups[i]!;
    const slot = group.badgePriority - 1;
    counts[slot] = counts[slot]! + 1;
    if (sampled[sampleCursor] === i) {
      frames.push(buildTraceFrame(sampleCursor, sampled.length, i, groups.length, group, counts));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<readonly ElfGroup[], number, ElfGroupTraceFrame> = {
  parse: parseElfGroups,
  solve: solvePart2,
  trace: tracePart2,
};
