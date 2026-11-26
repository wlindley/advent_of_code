import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solvePipeMazePart1, solver, tracePipeMazePart1 } from './index';

const EXAMPLES = [
  {
    name: 'clean 5x5 square loop',
    expected: 4,
    input: ['.....', '.S-7.', '.|.|.', '.L-J.', '.....'].join('\n'),
  },
  {
    name: 'cluttered 5x5 square loop',
    expected: 4,
    input: ['-L|F7', '7S-7|', 'L|7||', '-L-J|', 'L|-JF'].join('\n'),
  },
  {
    name: 'clean 5x5 complex loop',
    expected: 8,
    input: ['..F7.', '.FJ|.', 'SJ.L7', '|F--J', 'LJ...'].join('\n'),
  },
  {
    name: 'cluttered 5x5 complex loop',
    expected: 8,
    input: ['7-F7-', '.FJ|7', 'SJLL7', '|F--J', 'LJ.LJ'].join('\n'),
  },
] as const;

describe('2023 Day 10 Part 1 solver', () => {
  it('solves all four official example mazes', () => {
    for (const example of EXAMPLES) {
      const maze = solver.parse(example.input);
      expect(solvePipeMazePart1(maze), example.name).toBe(example.expected);
    }
  });

  it('solves loops across all six inferred S pipe shapes', () => {
    const cases = [
      { shape: '|', input: ['F7', 'S|', 'LJ'].join('\n'), expected: 3 },
      { shape: '-', input: ['FS7', 'L-J'].join('\n'), expected: 3 },
      { shape: 'L', input: ['F7', 'SJ'].join('\n'), expected: 2 },
      { shape: 'J', input: ['F7', 'LS'].join('\n'), expected: 2 },
      { shape: '7', input: ['FS', 'LJ'].join('\n'), expected: 2 },
      { shape: 'F', input: ['S7', 'LJ'].join('\n'), expected: 2 },
    ] as const;

    for (const c of cases) {
      const maze = solver.parse(c.input);
      expect(maze.inferredStartTile).toBe(c.shape);
      expect(solver.solve(maze)).toBe(c.expected);
    }
  });

  it('integrates with executeSolver and produces bounded trace frames', () => {
    const execution = executeSolver(solver, EXAMPLES[3].input);
    expect(execution.answer).toBe(8);
    expect(execution.runtime).toBe('main-thread');

    const maze = solver.parse(EXAMPLES[3].input);
    const frames = tracePipeMazePart1(maze, { maxSteps: 5 });
    expect(frames).toHaveLength(5);
    expect(frames[0]?.distance).toBe(0);
    expect(frames.at(-1)?.distance).toBe(8);
    expect(Object.isFrozen(solver)).toBe(true);
  });
});
