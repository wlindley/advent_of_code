import { describe, expect, it } from 'vitest';
import { HEADING_NAVIGATION_RULE, WAYPOINT_NAVIGATION_RULE } from './rules';
import { RainRiskSolver } from './solver';

const EXAMPLE_INPUT = ['F10', 'N3', 'F7', 'R90', 'F11'].join('\n');

describe('2020 Day 12 RainRiskSolver', () => {
  it('parses, solves, and traces under HEADING_NAVIGATION_RULE and WAYPOINT_NAVIGATION_RULE', () => {
    const part1 = new RainRiskSolver(HEADING_NAVIGATION_RULE);
    expect(part1.rule).toBe(HEADING_NAVIGATION_RULE);
    const parsed1 = part1.parse(EXAMPLE_INPUT);
    expect(part1.solve(parsed1)).toBe(25n);

    const fullTrace = part1.trace(parsed1);
    expect(fullTrace).toHaveLength(6);
    expect(fullTrace[5]!.state.manhattanDistance).toBe(25n);

    const cappedTrace = part1.trace(parsed1, { maxSteps: 3 });
    expect(cappedTrace.map((f) => f.stepIndex)).toEqual([0, 3, 5]);

    const part2 = new RainRiskSolver(WAYPOINT_NAVIGATION_RULE);
    expect(part2.solve(part2.parse(EXAMPLE_INPUT))).toBe(286n);
  });

  it('rejects invalid input and invalid trace maxSteps', () => {
    const solver = new RainRiskSolver(HEADING_NAVIGATION_RULE);
    const parsed = solver.parse(EXAMPLE_INPUT);

    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(parsed, { maxSteps: -2 })).toThrow(RangeError);
  });
});
