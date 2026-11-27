import { describe, expect, it } from 'vitest';
import { solver } from './index';

const EXAMPLE_INPUT = [
  '6,10',
  '0,14',
  '9,10',
  '0,3',
  '10,4',
  '4,11',
  '6,0',
  '6,12',
  '4,1',
  '0,13',
  '10,12',
  '3,4',
  '3,0',
  '8,4',
  '1,10',
  '2,14',
  '8,10',
  '9,0',
  '',
  'fold along y=7',
  'fold along x=5',
].join('\n');

describe('2021 Day 13 Part 1 solver', () => {
  it('solves the official 18-dot example to 17 visible dots after the first fold', () => {
    const manual = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(manual)).toBe(17);
  });

  it('captures trace frames and respects maxSteps bounds', () => {
    const manual = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace(manual);
    expect(full).toHaveLength(2);
    expect(full[0]?.kind).toBe('initial');
    expect(full[1]?.kind).toBe('folded');

    const one = solver.trace(manual, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]?.foldsApplied).toBe(1);

    expect(() => solver.trace(manual, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('rejects malformed or crease-colliding inputs', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.solve(solver.parse('1,2\n\nfold along x=1'))).toThrow(RangeError);
  });
});
