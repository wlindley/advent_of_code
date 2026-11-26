import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { PART2_EXAMPLE_ANSWER, PART2_EXAMPLE_INPUT, PART2_TARGET, solver } from './index';

describe('2019 Day 2 Part 2 solver', () => {
  it('parses and solves PART2_EXAMPLE_INPUT to 1202n via executeSolver', () => {
    expect(PART2_EXAMPLE_ANSWER).toBe('1202');
    expect(Object.isFrozen(solver)).toBe(true);
    const execution = executeSolver(solver, PART2_EXAMPLE_INPUT);
    expect(execution.answer).toBe(1202n);
    expect(execution.answer.toString()).toBe(PART2_EXAMPLE_ANSWER);
  });

  it('produces full and bounded execution traces for the winning (noun, verb) pair', () => {
    const program = solver.parse(PART2_EXAMPLE_INPUT);
    expect(program.length).toBe(100);
    expect(solver.solve(program)).toBe(1202n);

    const fullFrames = solver.trace(program);
    expect(fullFrames.length).toBe(5);
    expect(fullFrames[fullFrames.length - 1]!.memory[0]).toBe(PART2_TARGET);
    expect(fullFrames[fullFrames.length - 1]!.memory[1]).toBe(12n);
    expect(fullFrames[fullFrames.length - 1]!.memory[2]).toBe(2n);

    const boundedFrames = solver.trace(program, { maxSteps: 2 });
    expect(boundedFrames.length).toBe(2);
    expect(boundedFrames[boundedFrames.length - 1]!.memory[0]).toBe(PART2_TARGET);
  });

  it('propagates parse and search failures cleanly', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.solve(solver.parse('99'))).toThrow(RangeError);
    expect(() => solver.trace(solver.parse('99'))).toThrow(RangeError);
  });
});
