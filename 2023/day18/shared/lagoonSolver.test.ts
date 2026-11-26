import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../shared/core';
import { DIRECT_DIG_PLAN_DECODER, DigStep, type DigPlanDecoder } from './digPlan';
import { createLagoonSolver } from './lagoonSolver';

const EXAMPLE = [
  'R 6 (#70c710)',
  'D 5 (#0dc571)',
  'L 2 (#5713f0)',
  'D 2 (#d2c081)',
  'R 2 (#59c680)',
  'D 2 (#411b91)',
  'L 5 (#8ceee2)',
  'U 2 (#caa173)',
  'L 1 (#1b58a2)',
  'U 2 (#caa171)',
  'R 2 (#7807d2)',
  'U 3 (#a77fa3)',
  'L 2 (#015232)',
  'U 2 (#7a21e3)',
].join('\n');

describe('lagoonSolver', () => {
  it('creates a PuzzleSolver that parses, solves, and traces using the injected decoder', () => {
    const solver = createLagoonSolver(DIRECT_DIG_PLAN_DECODER);
    let tick = 100;
    const fakeClock: Clock = { nowMs: () => (tick += 5) };
    const result = executeSolver(solver, EXAMPLE, fakeClock);
    expect(result).toEqual({
      answer: 62n,
      elapsedMs: 5,
      runtime: 'main-thread',
    });

    const poly = solver.parse(EXAMPLE);
    const frames = solver.trace?.(poly, { maxSteps: 6 }) ?? [];
    expect(frames).toHaveLength(6);
    expect(frames[5]!.isComplete).toBe(true);
    expect(frames[5]!.cumulativeBoundary).toBe(38n);
    expect(frames[5]!.cumulativeSignedDoubleArea).toBe(84n);
  });

  it('delegates step decoding to a custom DigPlanDecoder', () => {
    const doubledDecoder: DigPlanDecoder = {
      decodeStep: (entry) => new DigStep(entry.direction, entry.distance * 2n, entry.color),
    };
    const solver = createLagoonSolver(doubledDecoder);
    const poly = solver.parse('R 1 (#111111)\nD 1 (#222222)\nL 1 (#333333)\nU 1 (#444444)');
    expect(solver.solve(poly)).toBe(9n);
    expect(solver.trace?.(poly)).toHaveLength(4);
  });
});
