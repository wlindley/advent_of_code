import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { DIR_E } from '../../shared';
import { PART1_ENTRY, solver } from './index';

const OFFICIAL_EXAMPLE_RAW = [
  '.|...\\....',
  '|.-.\\.....',
  '.....|-...',
  '........|.',
  '..........',
  '.........\\',
  '..../.\\\\..',
  '.-.-/..|..',
  '.|....-|.\\',
  '..//.|....',
].join('\n');

describe('Day 16 Part 1 solver', () => {
  it('defines PART1_ENTRY at (0, 0) heading East', () => {
    expect(PART1_ENTRY).toEqual({ row: 0, col: 0, dir: DIR_E });
    expect(Object.isFrozen(PART1_ENTRY)).toBe(true);
  });

  it('solves the official 10x10 example to 46 via executeSolver with a fake Clock', () => {
    let tick = 100;
    const fakeClock: Clock = {
      nowMs: () => {
        tick += 5;
        return tick;
      },
    };
    const result = executeSolver(solver, OFFICIAL_EXAMPLE_RAW, fakeClock);
    expect(result).toEqual({
      answer: 46,
      elapsedMs: 5,
      runtime: 'main-thread',
    });
  });

  it('traces sampled wavefront frames ending at the full energized count', () => {
    const contraption = solver.parse(OFFICIAL_EXAMPLE_RAW);
    const frames = solver.trace?.(contraption, { maxSteps: 6 }) ?? [];
    expect(frames).toHaveLength(6);
    expect(frames[0]!.entry).toEqual(PART1_ENTRY);
    expect(frames[0]!.energizedCount).toBe(1);
    expect(frames[5]!.energizedCount).toBe(46);
  });

  it('reflects immediately when entry tile (0, 0) is backslash', () => {
    const contraption = solver.parse('\\..\n|..\n...');
    expect(solver.solve(contraption)).toBe(3);
  });
});
