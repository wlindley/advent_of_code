import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = [
  'mxmxvkd kfcds sqjhc nhms (contains dairy, fish)',
  'trh fvjkl sbzzf mxmxvkd (contains dairy)',
  'sqjhc fvjkl (contains soy)',
  'sqjhc mxmxvkd sbzzf (contains fish)',
].join('\n');

describe('2020 Day 21 Part 1 solver', () => {
  it('counts safe ingredient appearances on the official 4-food example', () => {
    const result = executeSolver(solver, EXAMPLE_INPUT);
    expect(result.answer).toBe(5);
  });

  it('handles ambiguous multi-matching Part 1 cases without requiring unique peeling', () => {
    const multiInput = [
      'x y z (contains a, b)',
      'x y (contains a)',
      'x y (contains b)',
    ].join('\n');
    const result = executeSolver(solver, multiInput);
    expect(result.answer).toBe(1);
  });

  it('bounds trace frames via options.maxSteps and rejects invalid trace bounds', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.trace(parsed).length).toBe(4);
    const bounded = solver.trace(parsed, { maxSteps: 2 });
    expect(bounded.length).toBe(2);
    expect(bounded[0]!.foodIndex).toBe(0);
    expect(bounded[1]!.foodIndex).toBe(3);
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('rejects empty input, malformed syntax, and empty allergen intersections', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('alpha (has dairy)')).toThrow();
    expect(() => solver.solve(solver.parse('alpha (contains dairy)\nbeta (contains dairy)'))).toThrow();
  });
});
