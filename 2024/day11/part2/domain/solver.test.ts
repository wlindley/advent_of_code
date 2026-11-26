import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { PART2_BLINKS, solver } from './index';

describe('2024 Day 11 Part 2 solver', () => {
  it('uses 75 blinks and exposes a frozen PuzzleSolver', () => {
    expect(PART2_BLINKS).toBe(75);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('solves 125 17 to 65601038650482n and normalizes whitespace', () => {
    expect(executeSolver(solver, '125 17').answer).toBe(65601038650482n);
    expect(executeSolver(solver, '  125\t\n17  ').answer).toBe(65601038650482n);
  });

  it('produces 76 frozen trace frames for blinks 0..75', () => {
    const line = solver.parse('125 17');
    const frames = solver.trace!(line);

    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(76);
    for (let i = 0; i <= 75; i += 1) {
      expect(Object.isFrozen(frames[i])).toBe(true);
      expect(frames[i]!.blink).toBe(i);
      expect(frames[i]!.topBuckets.length).toBeLessThanOrEqual(12);
    }
    expect(frames[0]).toMatchObject({
      blink: 0,
      totalStones: 2n,
      distinctStones: 2,
      orderedPreview: [125n, 17n],
    });
    expect(frames[75]).toMatchObject({
      blink: 75,
      totalStones: 65601038650482n,
      orderedPreview: null,
    });
  });

  it('respects bounded trace maxSteps while preserving endpoints 0 and 75', () => {
    const frames = solver.trace!(solver.parse('125 17'), { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]!.blink).toBe(0);
    expect(frames[9]!.blink).toBe(75);
  });

  it('satisfies linearity and superposition across stone lines', () => {
    const zeroSingle = executeSolver(solver, '0').answer;
    expect(executeSolver(solver, '0 0').answer).toBe(2n * zeroSingle);

    const left = executeSolver(solver, '125').answer;
    const right = executeSolver(solver, '17').answer;
    expect(executeSolver(solver, '125 17').answer).toBe(left + right);
  });

  it('rejects empty string input', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
  });

  it('rejects whitespace-only input', () => {
    expect(() => solver.parse('   \n\t ')).toThrow(RangeError);
  });

  it('rejects negative stone token', () => {
    expect(() => solver.parse('-1')).toThrow(SyntaxError);
  });

  it('rejects decimal stone token', () => {
    expect(() => solver.parse('12.5')).toThrow(SyntaxError);
  });

  it('rejects non-numeric stone token', () => {
    expect(() => solver.parse('125 abc')).toThrow(SyntaxError);
  });

  it('rejects maxSteps equal to 0', () => {
    expect(() => solver.trace!(solver.parse('125 17'), { maxSteps: 0 })).toThrow(RangeError);
  });

  it('rejects negative maxSteps', () => {
    expect(() => solver.trace!(solver.parse('125 17'), { maxSteps: -1 })).toThrow(RangeError);
  });

  it('rejects fractional maxSteps', () => {
    expect(() => solver.trace!(solver.parse('125 17'), { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
