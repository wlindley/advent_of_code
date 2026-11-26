import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '1,0,1~1,2,1',
  '0,0,2~2,0,2',
  '0,2,3~2,2,3',
  '0,0,4~0,2,4',
  '2,0,5~2,2,5',
  '0,1,6~2,1,6',
  '1,1,8~1,1,9',
].join('\n');

describe('AoC 2023 Day 22 Part 1 solver', () => {
  it('parses and counts safely disintegratable bricks for the official 7-brick example', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(parsed)).toBe(5);
  });

  it('solves multi-level load-bearing chains and executes via shared runner', () => {
    const chain = '0,0,2~0,0,2\n0,0,4~1,0,4\n1,0,6~1,0,6';
    const result = executeSolver(solver, chain);
    expect(result.answer).toBe(1);
    expect(result.runtime).toBe('main-thread');
    const frames = solver.trace?.(solver.parse(chain));
    expect(frames?.length).toBe(4);
  });

  it('builds bounded trace frames and validates maxSteps', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    const bounded = solver.trace?.(parsed, { maxSteps: 3 });
    expect(bounded?.length).toBe(3);
    expect(bounded?.[0]?.step).toBe(0);
    expect(bounded?.[2]?.isFinal).toBe(true);
    expect(bounded?.[2]?.safeCount).toBe(5);
    expect(() => solver.trace?.(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });
});
