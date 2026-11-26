import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { DEFAULT_REDOUBT_SPACE, EXAMPLE_REDOUBT_SPACE, Robot } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PART1_SECONDS,
  createPart1Solver,
  solver,
  traceRobotSwarm,
} from './index';

const EXAMPLE_INPUT = [
  'p=0,4 v=3,-3',
  'p=6,3 v=-1,-3',
  'p=10,3 v=-1,2',
  'p=2,0 v=2,-1',
  'p=0,0 v=1,3',
  'p=3,0 v=-2,-2',
  'p=7,6 v=-1,-3',
  'p=3,0 v=-1,-2',
  'p=9,3 v=2,3',
  'p=7,3 v=-1,2',
  'p=2,4 v=2,-3',
  'p=9,5 v=-3,-3',
].join('\n');

describe('day14 part1 solver', () => {
  it('solves the official 11x7 example to 12 via executeSolver', () => {
    const exampleSolver = createPart1Solver(EXAMPLE_REDOUBT_SPACE, PART1_SECONDS);
    const execution = executeSolver(exampleSolver, EXAMPLE_INPUT, { nowMs: () => 5 });
    expect(execution.answer).toBe(12);
    expect(execution.elapsedMs).toBe(0);
    expect(execution.runtime).toBe('main-thread');
  });

  it('uses DEFAULT_REDOUBT_SPACE (101x103) and PART1_SECONDS (100) for exported solver', () => {
    const robots = solver.parse('p=0,0 v=1,1\np=100,0 v=-1,1\np=0,102 v=1,-1\np=100,102 v=-1,-1');
    expect(PART1_SECONDS).toBe(100);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(101);
    expect(solver.solve(robots)).toBe(1);
    const trace = solver.trace?.(robots);
    expect(trace).toHaveLength(101);
    expect(trace?.[0]?.second).toBe(0);
    expect(trace?.[0]?.highlight).toBe(false);
    expect(trace?.[100]?.second).toBe(100);
    expect(trace?.[100]?.highlight).toBe(true);
    expect(trace?.[100]?.space).toBe(DEFAULT_REDOUBT_SPACE);
  });

  it('bounds trace frames with maxSteps and preserves endpoints', () => {
    const robots = [new Robot(2, 4, 2, -3)];
    const sampled = traceRobotSwarm(robots, EXAMPLE_REDOUBT_SPACE, 100, { maxSteps: 11 });
    expect(Object.isFrozen(sampled)).toBe(true);
    expect(sampled).toHaveLength(11);
    expect(sampled[0]!.second).toBe(0);
    expect(sampled[10]!.second).toBe(100);
    expect(sampled[10]!.highlight).toBe(true);

    const zeroSec = traceRobotSwarm(robots, EXAMPLE_REDOUBT_SPACE, 0);
    expect(zeroSec).toHaveLength(1);
    expect(zeroSec[0]!.highlight).toBe(true);
  });

  it('validates seconds and maxSteps eagerly', () => {
    expect(() => createPart1Solver(EXAMPLE_REDOUBT_SPACE, -1)).toThrow(RangeError);
    expect(() => createPart1Solver(EXAMPLE_REDOUBT_SPACE, Number.MAX_SAFE_INTEGER)).toThrow(
      RangeError,
    );
    expect(() => traceRobotSwarm([], EXAMPLE_REDOUBT_SPACE, -1)).toThrow(RangeError);
    expect(() =>
      traceRobotSwarm([], EXAMPLE_REDOUBT_SPACE, Number.MAX_SAFE_INTEGER),
    ).toThrow(RangeError);
    expect(() => traceRobotSwarm([], EXAMPLE_REDOUBT_SPACE, 10, { maxSteps: 0 })).toThrow(
      RangeError,
    );
  });
});
