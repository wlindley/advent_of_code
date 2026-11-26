import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const PART2_EXAMPLE = [
  'Register A: 2024',
  'Register B: 0',
  'Register C: 0',
  '',
  'Program: 0,3,5,4,3,0',
].join('\n');

describe('2024 Day 17 Part 2 solver', () => {
  it('solves the official Part 2 example via executeSolver with deterministic clock', () => {
    let now = 50;
    const fakeClock: Clock = {
      nowMs: () => {
        now += 4.25;
        return now;
      },
    };
    const execution = executeSolver(solver, PART2_EXAMPLE, fakeClock);
    expect(execution.answer).toBe(117440n);
    expect(execution.elapsedMs).toBe(4.25);
  });

  it('produces both bounded and default verification traces ending with quine output', () => {
    const program = solver.parse(PART2_EXAMPLE);
    const bounded = solver.trace?.(program, { maxSteps: 8 }) ?? [];
    expect(bounded).toHaveLength(8);
    expect(bounded.at(-1)!.halted).toBe(true);
    expect(bounded.at(-1)!.output).toEqual(program.instructions);

    const full = solver.trace?.(program) ?? [];
    expect(full.length).toBeGreaterThan(8);
    expect(full[0]!.registers.a).toBe(117440n);
    expect(full.at(-1)!.output).toEqual(program.instructions);
  });

  it('propagates errors on invalid input and non-quine programs', () => {
    expect(() => solver.parse('Register A: 1')).toThrow();
    const noQuine = solver.parse('Register A: 0\nRegister B: 0\nRegister C: 0\nProgram: 5,1,0,3,3,0');
    expect(() => solver.solve(noQuine)).toThrow(Error);
  });
});
