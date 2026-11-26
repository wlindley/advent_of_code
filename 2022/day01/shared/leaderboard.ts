import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { ElfInventory } from './inventory';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface CalorieTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly elfIndex: number;
  readonly totalElves: number;
  readonly currentElf: ElfInventory;
  readonly leaders: readonly ElfInventory[];
  readonly enteredLeaderboard: boolean;
}

function validateTopCount(inventories: readonly ElfInventory[], topCount: number): void {
  if (!Number.isSafeInteger(topCount) || topCount < 1) {
    throw new RangeError(`topCount must be a positive safe integer, got ${topCount}`);
  }
  if (inventories.length < topCount) {
    throw new RangeError(`Need at least ${topCount} Elf inventories, got ${inventories.length}`);
  }
}

function insertLeader(
  leaders: readonly ElfInventory[],
  candidate: ElfInventory,
  topCount: number,
): readonly ElfInventory[] {
  const candidateCalories = candidate.totalCalories;
  let insertAt = leaders.length;
  for (let i = 0; i < leaders.length; i += 1) {
    // Strict > preserves earlier elfNumber on ties.
    if (candidateCalories > leaders[i]!.totalCalories) {
      insertAt = i;
      break;
    }
  }
  if (insertAt >= topCount) return leaders;
  const next = [...leaders.slice(0, insertAt), candidate, ...leaders.slice(insertAt)];
  if (next.length > topCount) {
    next.length = topCount;
  }
  return Object.freeze(next);
}

/** Sums totalCalories across inventories with safe-integer overflow protection. */
export function sumCalories(inventories: readonly ElfInventory[]): number {
  let total = 0;
  for (const elf of inventories) {
    const calories = elf.totalCalories;
    if (Number.MAX_SAFE_INTEGER - total < calories) {
      throw new RangeError('Combined calories exceed Number.MAX_SAFE_INTEGER');
    }
    total += calories;
  }
  return total;
}

/** Selects the top `topCount` Elves in a single pass using insertion into a bounded leaderboard. */
export function rankTopElves(
  inventories: readonly ElfInventory[],
  topCount: number,
): readonly ElfInventory[] {
  validateTopCount(inventories, topCount);
  let leaders: readonly ElfInventory[] = Object.freeze([]);
  for (const elf of inventories) {
    leaders = insertLeader(leaders, elf, topCount);
  }
  return leaders;
}

function buildTraceFrame(
  stepIndex: number,
  totalSteps: number,
  elfIndex: number,
  totalElves: number,
  currentElf: ElfInventory,
  leaders: readonly ElfInventory[],
  enteredLeaderboard: boolean,
): CalorieTraceFrame {
  return Object.freeze({
    stepIndex,
    totalSteps,
    elfIndex,
    totalElves,
    currentElf,
    leaders,
    enteredLeaderboard,
  });
}

/** Simulates all Elves while sampling up to `maxSteps` exact leaderboard frames. */
export function traceTopElves(
  inventories: readonly ElfInventory[],
  topCount: number,
  options?: TraceOptions,
): readonly CalorieTraceFrame[] {
  validateTopCount(inventories, topCount);
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(inventories.length, maxSteps);
  const frames: CalorieTraceFrame[] = [];
  let leaders: readonly ElfInventory[] = Object.freeze([]);
  let sampleCursor = 0;

  for (let i = 0; i < inventories.length; i += 1) {
    const currentElf = inventories[i]!;
    const nextLeaders = insertLeader(leaders, currentElf, topCount);
    const entered = nextLeaders !== leaders;
    leaders = nextLeaders;
    if (sampled[sampleCursor] === i) {
      frames.push(buildTraceFrame(sampleCursor, sampled.length, i, inventories.length, currentElf, leaders, entered));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
