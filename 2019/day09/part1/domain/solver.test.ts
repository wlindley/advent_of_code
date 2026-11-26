import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

describe('2019 Day 9 Part 1 solver', () => {
  it('solves official Day 9 16-digit and large-literal examples via executeSolver', () => {
    expect(executeSolver(solver, '1102,34915192,34915192,7,4,7,99,0').answer).toBe(1219070632396864n);
    expect(executeSolver(solver, '104,1125899906842624,99').answer).toBe(1125899906842624n);
  });

  it('supplies test-mode signal 1n into relative 203 and computes across sparse memory', () => {
    const program = solver.parse('109,500,203,5,22101,41,5,5,204,5,99');
    expect(solver.solve(program)).toBe(42n);

    const frames = solver.trace(program);
    expect(frames.length).toBe(5);
    expect(frames[0]!.relativeBaseAfter).toBe(500n);
    expect(frames[1]!.sparseEntries).toEqual([{ address: 505n, value: 1n }]);
    expect(frames[4]!.outputs).toEqual([42n]);
  });

  it('rejects malfunctioning multi-output runs and invalid inputs', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.solve(solver.parse('99'))).toThrow(Error);
    expect(() => solver.solve(solver.parse('104,203,104,204,104,999,99'))).toThrow(/203, 204/);
  });
});
