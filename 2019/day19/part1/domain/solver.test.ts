import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { EXAMPLE_BEAM_PROGRAM } from '../../shared';
import { solver } from './index';

describe('2019 Day 19 Part 1 solver', () => {
  it('solves the 59-cell example tractor beam program to 674', () => {
    const execution = executeSolver(solver, EXAMPLE_BEAM_PROGRAM);
    expect(execution.answer).toBe(674);
    expect(execution.runtime).toBe('main-thread');
  });

  it('produces bounded scan trace frames ending with 674 affected points', () => {
    const program = solver.parse(EXAMPLE_BEAM_PROGRAM);
    const frames = solver.trace(program, { maxSteps: 12 });
    expect(frames).toHaveLength(12);
    const first = frames[0]!;
    const last = frames[frames.length - 1]!;
    expect(first.kind).toBe('scan');
    expect(last.kind).toBe('scan');
    if (first.kind === 'scan' && last.kind === 'scan') {
      expect(first.activeY).toBe(0);
      expect(first.affectedCount).toBe(1);
      expect(last.activeY).toBe(49);
      expect(last.affectedCount).toBe(674);
    }
  });

  it('rejects empty inputs and invalid trace step limits', () => {
    expect(() => solver.parse('')).toThrow();
    const program = solver.parse(EXAMPLE_BEAM_PROGRAM);
    expect(() => solver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
  });
});
