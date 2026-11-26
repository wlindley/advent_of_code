import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solveRaceSheet, solver } from './solver';

const OFFICIAL_EXAMPLE = 'Time:      7  15   30\nDistance:  9  40  200\n';

describe('2023 Day 06 Part 1 solver', () => {
  it('solves the official example to 288n', () => {
    const sheet = solver.parse(OFFICIAL_EXAMPLE);
    expect(solveRaceSheet(sheet)).toBe(288n);
    expect(solver.solve(sheet)).toBe(288n);
  });

  it('executes via executeSolver with a hand-written fake Clock', () => {
    const ticks = [10, 14.5];
    let idx = 0;
    const fakeClock: Clock = {
      nowMs: () => ticks[idx++]!,
    };
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(result).toEqual({
      answer: 288n,
      elapsedMs: 4.5,
      runtime: 'main-thread',
    });
  });

  it('traces each race and running product', () => {
    const sheet = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace!(sheet);
    expect(frames.length).toBe(3);
    expect(frames.map((f) => f.waysToWin)).toEqual([4n, 8n, 9n]);
    expect(frames.map((f) => f.runningProduct)).toEqual([4n, 32n, 288n]);
  });

  it('zeros the product when any race is unwinnable', () => {
    const sheet = solver.parse('Time: 7 4\nDistance: 9 4');
    expect(solver.solve(sheet)).toBe(0n);
  });

  it('freezes the solver object and propagates parse errors', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    expect(() => solver.parse('Time: 7\nDistance: 9 40')).toThrow(SyntaxError);
  });
});
