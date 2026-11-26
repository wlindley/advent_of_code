import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, solveSpinCycleLoad, solver } from './index';

const EXAMPLE = [
  'O....#....',
  'O.OO#....#',
  '.....##...',
  'OO.#O....O',
  '.O.....O#.',
  'O.#..O.#.#',
  '..O..#O..O',
  '.......O..',
  '#....###..',
  '#OO..#....',
].join('\n');

function makeFakeClock(times: readonly number[]): Clock {
  let index = 0;
  return {
    nowMs: () => times[index++] ?? times[times.length - 1]!,
  };
}

describe('2023/day14/part2/domain/solver', () => {
  it('parses and solves the official example to 64 and supports custom cycle targets', () => {
    const platform = solver.parse(EXAMPLE);
    expect(solver.solve(platform)).toBe(64);
    expect(solveSpinCycleLoad(platform, 3)).toBe(69);
    expect(solveSpinCycleLoad(platform, 0)).toBe(104);
  });

  it('executes cleanly through executeSolver with a deterministic clock', () => {
    const result = executeSolver(solver, EXAMPLE, makeFakeClock([100, 108.25]));
    expect(result).toEqual({
      answer: 64,
      elapsedMs: 8.25,
      runtime: 'main-thread',
    });
  });

  it('exposes bounded trace through solver.trace', () => {
    const platform = solver.parse(EXAMPLE);
    const trace = solver.trace!(platform, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    expect(trace).toHaveLength(12);
    expect(trace[trace.length - 1]!.phase).toBe('projection');
    expect(trace[trace.length - 1]!.platform.northLoad).toBe(64);
  });

  it.each(['', 'O.\nO', 'O?.\n...'])('rejects invalid input %j', (bad) => {
    expect(() => solver.parse(bad)).toThrow(RangeError);
  });
});
