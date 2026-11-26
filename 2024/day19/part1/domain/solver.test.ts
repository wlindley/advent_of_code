import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solvePart1, solver } from './index';

const EXAMPLE_INPUT = [
  'r, wr, b, g, bwu, rb, gb, br',
  '',
  'brwrr',
  'bggr',
  'gbbr',
  'rrbgbr',
  'ubwu',
  'bwurrg',
  'brgr',
  'bbrgwb',
].join('\n');

describe('Day 19 Part 1 solver', () => {
  it('solves the official example via solvePart1 and executeSolver with a deterministic clock', () => {
    let ticks = 100;
    const fakeClock: Clock = { nowMs: () => (ticks += 12) };
    const result = executeSolver(solver, EXAMPLE_INPUT, fakeClock);

    expect(result.answer).toBe(6);
    expect(result.elapsedMs).toBe(12);
    expect(result.runtime).toBe('main-thread');
    expect(solvePart1(solver.parse(EXAMPLE_INPUT))).toBe(6);
  });

  it('produces traces with and without options and rejects malformed inputs', () => {
    const layout = solver.parse(EXAMPLE_INPUT);
    const fullTrace = solver.trace!(layout);
    expect(fullTrace.length).toBe(8);
    expect(fullTrace[7]!.cumulativePossible).toBe(6);

    const cappedTrace = solver.trace!(layout, { maxSteps: 3 });
    expect(cappedTrace.length).toBe(3);
    expect(cappedTrace[2]!.cumulativePossible).toBe(6);

    expect(() => solver.parse('r, wr\nbrwrr')).toThrow(Error);
  });
});
