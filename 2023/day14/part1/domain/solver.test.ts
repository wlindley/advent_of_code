import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, solver } from './index';

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

describe('2023/day14/part1/domain/solver', () => {
  it('solves the official example to 136', () => {
    expect(solver.solve(solver.parse(EXAMPLE))).toBe(136);
  });

  it('solves edge grids with single cells, blockers, and empty lanes', () => {
    expect(solver.solve(solver.parse('.'))).toBe(0);
    expect(solver.solve(solver.parse('O'))).toBe(1);
    expect(solver.solve(solver.parse('#\nO'))).toBe(1);
    expect(solver.solve(solver.parse('O\n.\n.'))).toBe(3);
    expect(solver.solve(solver.parse('.\n.\nO'))).toBe(3);
  });

  it('executes cleanly through executeSolver with a deterministic clock', () => {
    const result = executeSolver(solver, EXAMPLE, makeFakeClock([10, 14.5]));
    expect(result).toEqual({
      answer: 136,
      elapsedMs: 4.5,
      runtime: 'main-thread',
    });
  });

  it('traces full column-by-column north settling by default and stays frozen', () => {
    const platform = solver.parse(EXAMPLE);
    const trace = solver.trace!(platform);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    expect(trace).toHaveLength(11);
    expect(Object.isFrozen(trace)).toBe(true);
    expect(trace[0]!.settledColumns).toBe(0);
    expect(trace[0]!.platform.fingerprint()).toBe(platform.fingerprint());
    expect(trace[10]!.settledColumns).toBe(10);
    expect(trace[10]!.platform.northLoad).toBe(136);
    for (const frame of trace) {
      expect(Object.isFrozen(frame)).toBe(true);
    }
  });

  it('supports bounded maxSteps sampling including 1, 2, 4, and 1x1 inputs', () => {
    const platform = solver.parse(EXAMPLE);
    const single = solver.trace!(platform, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.settledColumns).toBe(10);
    expect(single[0]!.platform.northLoad).toBe(136);

    const endpoints = solver.trace!(platform, { maxSteps: 2 });
    expect(endpoints.map((f) => f.settledColumns)).toEqual([0, 10]);

    const sampled = solver.trace!(platform, { maxSteps: 4 });
    expect(sampled.map((f) => f.settledColumns)).toEqual([0, 3, 7, 10]);
    expect(sampled[1]!.platform.toLines()[0]).toBe('OOO..#....');

    const tiny = solver.trace!(solver.parse('O'));
    expect(tiny.map((f) => [f.step, f.settledColumns])).toEqual([
      [0, 0],
      [1, 1],
    ]);
  });

  it.each([0, -2, 1.5])('rejects invalid maxSteps %s', (bad) => {
    const platform = solver.parse(EXAMPLE);
    expect(() => solver.trace!(platform, { maxSteps: bad })).toThrow(RangeError);
  });
});
