import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { EXAMPLE_RUN_ANSWER, EXAMPLE_SPRINGDROID_PROGRAM, EXAMPLE_WALK_ANSWER } from './exampleProgram';
import {
  DEFAULT_MAX_TRACE_STEPS,
  RUN_POLICY,
  SpringdroidSolver,
  WALK_POLICY,
} from './springdroidSolver';

describe('SpringdroidSolver', () => {
  it('solves WALK and RUN policies against the example Intcode ROM', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const walkSolver = new SpringdroidSolver(WALK_POLICY);
    const runSolver = new SpringdroidSolver(RUN_POLICY);

    expect(executeSolver(walkSolver, EXAMPLE_SPRINGDROID_PROGRAM).answer).toBe(EXAMPLE_WALK_ANSWER);
    expect(executeSolver(runSolver, EXAMPLE_SPRINGDROID_PROGRAM).answer).toBe(EXAMPLE_RUN_ANSWER);
  });

  it('produces bounded trace frames covering all demo hulls for WALK and RUN', () => {
    const walkSolver = new SpringdroidSolver(WALK_POLICY);
    const program = walkSolver.parse(EXAMPLE_SPRINGDROID_PROGRAM);
    const fullFrames = walkSolver.trace(program);
    expect(fullFrames.length).toBeGreaterThan(10);
    expect(fullFrames[0]?.stepIndex).toBe(0);
    expect(fullFrames[0]?.mode).toBe('WALK');
    expect(fullFrames[fullFrames.length - 1]?.stepIndex).toBe(fullFrames[fullFrames.length - 1]!.totalSteps - 1);
    expect(fullFrames[fullFrames.length - 1]?.hullDamage).toBe(EXAMPLE_WALK_ANSWER);
    expect(fullFrames.every((frame) => frame.crossed)).toBe(true);

    const sampled = walkSolver.trace(program, { maxSteps: 6 });
    expect(sampled.length).toBe(6);
    expect(sampled[0]?.stepIndex).toBe(0);
    expect(sampled[5]?.stepIndex).toBe(sampled[5]!.totalSteps - 1);

    const runSolver = new SpringdroidSolver(RUN_POLICY);
    const runFrames = runSolver.trace(runSolver.parse(EXAMPLE_SPRINGDROID_PROGRAM), { maxSteps: 8 });
    expect(runFrames.length).toBe(8);
    expect(runFrames[0]?.mode).toBe('RUN');
    expect(runFrames[7]?.hullDamage).toBe(EXAMPLE_RUN_ANSWER);
    expect(runFrames.every((frame) => frame.crossed)).toBe(true);
  });

  it('rejects invalid inputs, missing hull damage, and non-positive maxSteps', () => {
    const walkSolver = new SpringdroidSolver(WALK_POLICY);
    expect(() => walkSolver.parse('')).toThrow();
    const program = walkSolver.parse(EXAMPLE_SPRINGDROID_PROGRAM);
    expect(() => walkSolver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => walkSolver.solve(walkSolver.parse('99'))).toThrow(/did not report/);
  });
});
