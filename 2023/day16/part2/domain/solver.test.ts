import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { createBeamState, DIR_S } from '../../shared';
import { solver } from './index';

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

function createFakeClock(times: readonly number[]): Clock {
  let index = 0;
  return {
    nowMs: () => times[index++] ?? times[times.length - 1]!,
  };
}

describe('day16 part2 solver', () => {
  it('executes parse and solve on the official example with deterministic timing', () => {
    const result = executeSolver(solver, OFFICIAL_EXAMPLE_RAW, createFakeClock([10, 15]));
    expect(result).toEqual({
      answer: 51,
      elapsedMs: 5,
      runtime: 'main-thread',
    });
  });

  it('traces sampled optimal wavefront frames starting at (0, 3, DIR_S) and ending at 51', () => {
    const contraption = solver.parse(OFFICIAL_EXAMPLE_RAW);
    const frames = solver.trace?.(contraption, { maxSteps: 6 });
    expect(frames).toBeDefined();
    expect(frames).toHaveLength(6);
    expect(frames![0]!.entry).toEqual(createBeamState(0, 3, DIR_S));
    expect(frames![0]!.energizedCount).toBe(1);
    expect(frames![5]!.energizedCount).toBe(51);
  });

  it('rejects empty, ragged, and invalid-character raw inputs', () => {
    expect(() => solver.parse('   \n  ')).toThrow();
    expect(() => solver.parse('...\n..')).toThrow(RangeError);
    expect(() => solver.parse('..x\n...')).toThrow(RangeError);
  });
});
