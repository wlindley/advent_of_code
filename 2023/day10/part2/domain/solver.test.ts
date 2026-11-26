import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { parsePipeMaze } from '../../shared';
import { solvePipeMazePart2, solver, tracePipeMazePart2 } from './index';

const EXAMPLE_4 = [
  'FF7FSF7F7F7F7F7F---7',
  'L|LJ||||||||||||F--J',
  'FL-7LJLJ||||||LJL-77',
  'F--JF--7||LJLJ7F7FJ-',
  'L---JF-JLJ.||-FJLJJ7',
  '|F|F-JF---7F7-L7L|7|',
  '|FFJF7L7F-JF7|JL---7',
  '7-L-JL7||F7|L7F-7F7|',
  'L.L7LFJ|||||FJL7||LJ',
  'L7JLJL-JLJLJL--JLJ.L',
].join('\n');

describe('solvePipeMazePart2 & solver', () => {
  it('solves parsed maze and produces bounded row-scan trace', () => {
    const maze = parsePipeMaze(EXAMPLE_4);
    expect(solvePipeMazePart2(maze)).toBe(10);

    const trace = tracePipeMazePart2(maze, { maxSteps: 5 });
    expect(trace).toHaveLength(5);
    expect(trace[trace.length - 1]?.cumulativeEnclosed).toBe(10);
  });

  it('exports a frozen PuzzleSolver compatible with executeSolver', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    const execution = executeSolver(solver, EXAMPLE_4);
    expect(execution.answer).toBe(10);
    expect(execution.runtime).toBe('main-thread');

    const trace = solver.trace?.(solver.parse(EXAMPLE_4), { maxSteps: 6 });
    expect(trace).toHaveLength(6);
    expect(trace?.[5]?.cumulativeEnclosed).toBe(10);
  });

  it('propagates parsing and broken-loop errors cleanly', () => {
    expect(() => executeSolver(solver, '...\n...\n...')).toThrow(/Missing start tile/);
    expect(() => executeSolver(solver, ['...', '.S-', '...'].join('\n'))).toThrow();
  });
});
