import {
  type PuzzleSolver,
  type TraceOptions,
  sampleTraceIndices,
  validateMaxSteps,
} from '../../../../shared/core';
import {
  DEFAULT_REDOUBT_SPACE,
  type RedoubtSnapshot,
  type Robot,
  type TorusSpace,
  assertNonNegativeSafeInt,
  buildRedoubtSnapshot,
  evaluateSafetyFactor,
  parseRobots,
} from '../../shared';

export const PART1_SECONDS = 100;
export const DEFAULT_MAX_TRACE_STEPS = 101;

function assertTraceSeconds(seconds: number): void {
  assertNonNegativeSafeInt(seconds, 'seconds');
  if (!Number.isSafeInteger(seconds + 1)) {
    throw new RangeError(`seconds + 1 must be a safe integer, got ${seconds}`);
  }
}

/** Samples bounded occupancy snapshots across `[0, seconds]` with endpoint preservation. */
export function traceRobotSwarm(
  robots: readonly Robot[],
  space: TorusSpace,
  seconds: number,
  options?: TraceOptions,
): readonly RedoubtSnapshot[] {
  assertTraceSeconds(seconds);
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const indices = sampleTraceIndices(seconds + 1, limit);
  const frames: RedoubtSnapshot[] = [];
  for (const t of indices) {
    frames.push(buildRedoubtSnapshot(robots, space, t, { highlight: t === seconds }));
  }
  return Object.freeze(frames);
}

/** Creates a parameterized Part 1 safety-factor solver for a given `space` and `seconds`. */
export function createPart1Solver(
  space: TorusSpace = DEFAULT_REDOUBT_SPACE,
  seconds: number = PART1_SECONDS,
): PuzzleSolver<readonly Robot[], number, RedoubtSnapshot> {
  assertTraceSeconds(seconds);
  return {
    parse: parseRobots,
    solve: (robots) => evaluateSafetyFactor(robots, space, seconds),
    trace: (robots, options) => traceRobotSwarm(robots, space, seconds, options),
  };
}

export const solver = createPart1Solver(DEFAULT_REDOUBT_SPACE, PART1_SECONDS);
