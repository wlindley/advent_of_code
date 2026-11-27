import { describe, expect, it } from 'vitest';
import { solver } from './solver';

const EXAMPLE_INPUT = ['.#..#', '.....', '#####', '....#', '...##'].join('\n');

describe('2019 Day 10 Part 1 solver', () => {
  it('parses, solves, and traces the official 5x5 example with omitted and explicit options', () => {
    const map = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(map)).toBe(8);

    const fullTrace = solver.trace(map);
    expect(fullTrace).toHaveLength(10);
    expect(fullTrace[fullTrace.length - 1]!.bestDetectedCount).toBe(8);

    const cappedTrace = solver.trace(map, { maxSteps: 4 });
    expect(cappedTrace).toHaveLength(4);
  });

  it('rejects empty, ragged, invalid-character, and asteroid-free inputs', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('#.\n#')).toThrow(RangeError);
    expect(() => solver.parse('#@\n..')).toThrow(RangeError);
    expect(() => solver.parse('..\n..')).toThrow(RangeError);
  });
});
