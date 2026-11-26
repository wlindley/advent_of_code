import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import { parseLanternfishSchool } from './parser';
import { LanternfishSchool, validateSimulationDays } from './school';

export const PART1_DAYS = 80;
export const PART2_DAYS = 256;
export const DEFAULT_MAX_TRACE_STEPS = 257;

/** Immutable simulation snapshot at a specific day index. */
export class LanternfishTraceFrame {
  readonly day: number;
  readonly school: LanternfishSchool;

  constructor(day: number, school: LanternfishSchool) {
    this.day = validateSimulationDays(day);
    this.school = school;
    Object.freeze(this);
  }

  get totalPopulation(): bigint {
    return this.school.totalPopulation;
  }

  get spawningNext(): bigint {
    return this.school.spawningCount;
  }

  get spawnedToday(): bigint {
    return this.day === 0 ? 0n : this.school.newbornCount;
  }
}

/** Generates sampled simulation snapshots across `[0, days]` preserving endpoints. */
export function traceLanternfish(
  initialSchool: LanternfishSchool,
  days: number,
  options?: TraceOptions,
): readonly LanternfishTraceFrame[] {
  const totalDays = validateSimulationDays(days);
  const maxSteps = options === undefined ? undefined : options.maxSteps;
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(totalDays + 1, limit);

  const frames: LanternfishTraceFrame[] = [];
  let school = initialSchool;
  let samplePos = 0;

  for (let day = 0; day <= totalDays; day += 1) {
    if (sampled[samplePos] === day) {
      frames.push(new LanternfishTraceFrame(day, school));
      samplePos += 1;
    }
    if (day < totalDays) {
      school = school.advance(1);
    }
  }
  return Object.freeze(frames);
}

/** Parameterized lanternfish population solver for a fixed day horizon. */
export class LanternfishSolver
  implements Required<PuzzleSolver<LanternfishSchool, bigint, LanternfishTraceFrame>>
{
  readonly days: number;

  constructor(days: number) {
    this.days = validateSimulationDays(days);
    Object.freeze(this);
  }

  parse(raw: string): LanternfishSchool {
    return parseLanternfishSchool(raw);
  }

  solve(school: LanternfishSchool): bigint {
    return school.advance(this.days).totalPopulation;
  }

  trace(school: LanternfishSchool, options?: TraceOptions): readonly LanternfishTraceFrame[] {
    return traceLanternfish(school, this.days, options);
  }
}
