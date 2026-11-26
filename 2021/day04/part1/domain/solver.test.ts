import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = [
  '7,4,9,5,11,17,23,2,0,14,21,24,10,16,13,6,15,25,12,22,18,20,8,19,3,26,1',
  '',
  '22 13 17 11  0',
  ' 8  2 23  4 24',
  '21  9 14 16  7',
  ' 6 10  3 18  5',
  ' 1 12 20 15 19',
  '',
  ' 3 15  0  2 22',
  ' 9 18 13 17  5',
  '19  8  7 25 23',
  '20 11 10 24  4',
  '14 21 16 12  6',
  '',
  '14 21 17 24  4',
  '10 16 15  9 19',
  '18  8 23 26 20',
  '22 11 13  6  5',
  ' 2  0 12  3  7',
].join('\n');

function fixedNowMs(): number {
  return 100;
}

const FIXED_CLOCK: Clock = Object.freeze({ nowMs: fixedNowMs });

describe('2021 Day 4 Part 1 solver', () => {
  it('solves the official example to 4512n', () => {
    const game = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(game)).toBe(4512n);
  });

  it('integrates with executeSolver and propagates parse/solve errors', () => {
    const result = executeSolver(solver, EXAMPLE_INPUT, FIXED_CLOCK);
    expect(result.answer).toBe(4512n);
    expect(result.elapsedMs).toBe(0);
    expect(result.runtime).toBe('main-thread');

    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('1,bad\n\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25')).toThrow(
      SyntaxError,
    );
    const noWin = solver.parse('99\n\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15\n16 17 18 19 20\n21 22 23 24 25');
    expect(() => solver.solve(noWin)).toThrow(RangeError);
  });

  it('produces default and maxSteps-bounded trace frames', () => {
    const game = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace!(game);
    expect(full.length).toBe(12);
    expect(full[11]?.drawnValue).toBe(24);
    expect(full[11]?.isTargetWon).toBe(true);

    const bounded = solver.trace!(game, { maxSteps: 4 });
    expect(bounded.map((frame) => frame.drawIndex)).toEqual([0, 4, 7, 11]);
    expect(bounded[3]?.targetSnapshot.unmarkedSum).toBe(188n);
  });
});
