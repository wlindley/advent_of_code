import { describe, expect, it } from 'vitest';
import { solver } from './solver';

const EXAMPLE_INPUT =
  '3,43,104,1,104,0,3,43,104,0,104,0,3,43,104,1,104,0,3,43,104,1,104,0,3,43,104,0,104,1,3,43,104,1,104,0,3,43,104,1,104,0,99';

describe('2019 Day 11 Part 1 solver', () => {
  it('parses, solves, and traces with omitted and explicit options', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(6);

    const defaultFrames = solver.trace(parsed);
    expect(defaultFrames).toHaveLength(8);
    expect(defaultFrames[0]!.startPanelColor).toBe(0);
    expect(defaultFrames[7]!.stepIndex).toBe(7);

    const boundedFrames = solver.trace(parsed, { maxSteps: 3 });
    expect(boundedFrames).toHaveLength(3);
    expect(boundedFrames[0]!.stepIndex).toBe(0);
    expect(boundedFrames[2]!.stepIndex).toBe(7);
  });

  it('rejects invalid program input and invalid trace options', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1,2,foo')).toThrow();
    const parsed = solver.parse('99');
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });
});
