import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { createPlutonianPebblesSolver } from '../../shared';
import { PART1_BLINKS, solver } from './index';

describe('2024 Day 11 Part 1 solver', () => {
  it('uses 25 blinks and exposes a frozen PuzzleSolver', () => {
    expect(PART1_BLINKS).toBe(25);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('solves the AoC 125 17 example to 55312n', () => {
    const execution = executeSolver(solver, '125 17');
    expect(execution.answer).toBe(55312n);
  });

  it('produces 26 trace frames ending at blink 25 with 55312n stones', () => {
    const line = solver.parse('125 17');
    const frames = solver.trace!(line);
    expect(frames).toHaveLength(26);
    expect(frames[0]!.blink).toBe(0);
    expect(frames[0]!.totalStones).toBe(2n);
    expect(frames[25]!.blink).toBe(25);
    expect(frames[25]!.totalStones).toBe(55312n);
  });

  it('respects trace maxSteps option', () => {
    const line = solver.parse('125 17');
    const frames = solver.trace!(line, { maxSteps: 5 });
    expect(frames).toHaveLength(5);
    expect(frames[0]!.blink).toBe(0);
    expect(frames[4]!.blink).toBe(25);
  });

  it('validates blinkCount eagerly in createPlutonianPebblesSolver', () => {
    expect(() => createPlutonianPebblesSolver(-1)).toThrow(RangeError);
  });
});
