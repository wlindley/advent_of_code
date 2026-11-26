import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = ['1', '2', '-3', '3', '-2', '0', '4'].join('\n');

describe('2022 Day 20 Part 1 solver', () => {
  it('solves the official example via executeSolver with a fake Clock', () => {
    let tick = 50;
    const fakeClock: Clock = { nowMs: () => (tick += 7) };
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);

    expect(exec.answer).toBe(3n);
    expect(exec.elapsedMs).toBe(7);
    expect(exec.runtime).toBe('main-thread');
  });

  it('produces trace frames with omitted options and explicit maxSteps', () => {
    const file = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(file);
    expect(full).toHaveLength(8);
    expect(full[full.length - 1]!.coordinates.sum).toBe(3n);

    const capped = solver.trace(file, { maxSteps: 4 });
    expect(capped).toHaveLength(4);
    expect(capped[3]!.finalSum).toBe(3n);
  });

  it('rejects invalid input at parse boundary', () => {
    expect(() => solver.parse('1\nnot-a-number\n0')).toThrow(SyntaxError);
    expect(() => solver.parse('1\n2\n3')).toThrow(RangeError);
  });
});
