import { describe, expect, it } from 'vitest';
import { HEADING_NAVIGATION_RULE } from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = ['F10', 'N3', 'F7', 'R90', 'F11'].join('\n');

describe('2020 Day 12 Part 1 solver', () => {
  it('uses HEADING_NAVIGATION_RULE and solves the official example to 25n', () => {
    expect(solver.rule).toBe(HEADING_NAVIGATION_RULE);
    const instructions = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(instructions)).toBe(25n);
  });

  it('produces traces with omitted and explicit options and rejects invalid inputs', () => {
    const instructions = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace(instructions);
    expect(full).toHaveLength(6);
    expect(full[5]!.state.manhattanDistance).toBe(25n);

    const capped = solver.trace(instructions, { maxSteps: 3 });
    expect(capped.map((frame) => frame.stepIndex)).toEqual([0, 3, 5]);

    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('Q10')).toThrow(Error);
    expect(() => solver.parse('L45')).toThrow(RangeError);
    expect(() => solver.trace(instructions, { maxSteps: 0 })).toThrow(RangeError);
  });
});
