import { describe, expect, it } from 'vitest';
import { PART1_TARGET_TURN } from '../../shared';
import { solver } from './solver';

const OFFICIAL_EXAMPLES: readonly [string, number][] = [
  ['0,3,6', 436],
  ['1,3,2', 1],
  ['2,1,3', 10],
  ['1,2,3', 27],
  ['2,3,1', 78],
  ['3,2,1', 438],
  ['3,1,2', 1836],
];

describe('2020 Day 15 Part 1 solver', () => {
  it('targets turn 2020 and solves all 7 official Part 1 examples', () => {
    expect(solver.targetTurn).toBe(PART1_TARGET_TURN);
    for (const [raw, expected] of OFFICIAL_EXAMPLES) {
      const seq = solver.parse(raw);
      expect(solver.solve(seq)).toBe(expected);
    }
  });

  it('produces bounded trace frames ending with the Part 1 answer', () => {
    const seq = solver.parse('0,3,6');
    const frames = solver.trace(seq);
    expect(frames).toHaveLength(200);
    expect(frames[frames.length - 1]!.isFinal).toBe(true);
    expect(frames[frames.length - 1]!.spoken).toBe(436);

    const capped = solver.trace(seq, { maxSteps: 10 });
    expect(capped).toHaveLength(10);
    expect(capped[9]!.spoken).toBe(436);
  });
});
