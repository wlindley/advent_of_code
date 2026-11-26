import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { DEFAULT_INITIAL_PADDING, DiffusionGrid } from './gridBuffer';
import { type DiffusionFrame, type ElfCoord, SimulationResult } from './types';

export const DEFAULT_PART1_ROUNDS = 10;
export const DEFAULT_MAX_STATIC_ROUNDS = 100_000;
export const DEFAULT_TRACE_MAX_STEPS = 48;

/** Simulates up to `rounds` rounds, exiting early if static equilibrium is reached. */
export function simulateRounds(elves: readonly ElfCoord[], rounds: number): SimulationResult {
  if (!Number.isInteger(rounds) || rounds < 0) {
    throw new RangeError(`rounds must be a non-negative integer, got ${rounds}`);
  }
  const grid = new DiffusionGrid(elves, DEFAULT_INITIAL_PADDING);
  for (let round = 1; round <= rounds; round += 1) {
    if (grid.stepRound(round).movedCount === 0) {
      // Static-Equivalence Theorem: 0 moves means every elf is isolated and future rounds are identical.
      return new SimulationResult(round, grid.bounds, grid.elfCount, true);
    }
  }
  return new SimulationResult(rounds, grid.bounds, grid.elfCount, false);
}

/** Returns the 1-indexed round number at which no elf moves, bounded by `maxRounds`. */
export function findFirstStaticRound(elves: readonly ElfCoord[], maxRounds: number): number {
  if (!Number.isInteger(maxRounds) || maxRounds < 1) {
    throw new RangeError(`maxRounds must be a positive integer, got ${maxRounds}`);
  }
  const grid = new DiffusionGrid(elves, DEFAULT_INITIAL_PADDING);
  for (let round = 1; round <= maxRounds; round += 1) {
    if (grid.stepRound(round).movedCount === 0) return round;
  }
  throw new Error(`Did not reach static state within ${maxRounds} rounds`);
}

function captureSampledFrames(
  elves: readonly ElfCoord[],
  sampledRounds: readonly number[],
): readonly DiffusionFrame[] {
  const grid = new DiffusionGrid(elves, DEFAULT_INITIAL_PADDING);
  const frames: DiffusionFrame[] = [];
  let cursor = 0;
  if (sampledRounds[0] === 0) {
    frames.push(grid.initialFrame());
    cursor += 1;
  }
  for (let round = 1; cursor < sampledRounds.length; round += 1) {
    const summary = grid.stepRound(round);
    if (round === sampledRounds[cursor]) {
      frames.push(grid.toFrame(summary));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

/** Produces bounded trace frames for a fixed round budget (stopping early if static). */
export function traceFixedRounds(
  elves: readonly ElfCoord[],
  rounds: number,
  options?: TraceOptions,
): readonly DiffusionFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const totalRounds = simulateRounds(elves, rounds).roundsCompleted;
  return captureSampledFrames(elves, sampleTraceIndices(totalRounds + 1, maxSteps));
}

/** Produces bounded trace frames from round 0 through the first static round. */
export function traceUntilStatic(
  elves: readonly ElfCoord[],
  maxRounds: number,
  options?: TraceOptions,
): readonly DiffusionFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const staticRound = findFirstStaticRound(elves, maxRounds);
  return captureSampledFrames(elves, sampleTraceIndices(staticRound + 1, maxSteps));
}
