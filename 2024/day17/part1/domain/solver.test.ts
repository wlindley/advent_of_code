import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const MAIN_EXAMPLE = [
  'Register A: 729',
  'Register B: 0',
  'Register C: 0',
  '',
  'Program: 0,1,5,4,3,0',
].join('\n');

describe('2024 Day 17 Part 1 solver', () => {
  it('solves the main example via parse, solve, and executeSolver', () => {
    let now = 100;
    const fakeClock: Clock = {
      nowMs: () => {
        now += 7.5;
        return now;
      },
    };

    const execution = executeSolver(solver, MAIN_EXAMPLE, fakeClock);
    expect(execution.answer).toBe('4,6,3,5,6,3,5,2,1,0');
    expect(execution.elapsedMs).toBe(7.5);
    expect(execution.runtime).toBe('main-thread');
  });

  it('produces bounded trace frames ending in halted output state', () => {
    const program = solver.parse(MAIN_EXAMPLE);
    const frames = solver.trace?.(program, { maxSteps: 6 }) ?? [];

    expect(frames).toHaveLength(6);
    expect(frames[0]!.step).toBe(0);
    expect(frames.at(-1)!.halted).toBe(true);
    expect(frames.at(-1)!.output.join(',')).toBe('4,6,3,5,6,3,5,2,1,0');
  });

  it('throws on invalid input or reserved combo operand 7 during execution', () => {
    expect(() => solver.parse('Register A: 1')).toThrow();
    const badProgram = solver.parse('Register A: 1\nRegister B: 0\nRegister C: 0\nProgram: 5,7');
    expect(() => solver.solve(badProgram)).toThrow(RangeError);
  });
});
