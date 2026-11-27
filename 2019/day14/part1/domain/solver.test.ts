import { describe, expect, it } from 'vitest';
import { solver } from './solver';

const EXAMPLE_1 = [
  '10 ORE => 10 A',
  '1 ORE => 1 B',
  '7 A, 1 B => 1 C',
  '7 A, 1 C => 1 D',
  '7 A, 1 D => 1 E',
  '7 A, 1 E => 1 FUEL',
].join('\n');

describe('2019 Day 14 Part 1 solver', () => {
  it('parses, solves, and traces the official example', () => {
    const network = solver.parse(EXAMPLE_1);
    expect(solver.solve(network)).toBe(31n);

    const full = solver.trace(network);
    expect(full).toHaveLength(7);
    expect(full[6]!.cumulativeOre).toBe(31n);

    const bounded = solver.trace(network, { maxSteps: 3 });
    expect(bounded).toHaveLength(3);
    expect(bounded[0]!.stepIndex).toBe(0);
    expect(bounded[2]!.stepIndex).toBe(6);
  });

  it('rejects invalid inputs and invalid trace options', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1 ORE => 1 A')).toThrow();
    const network = solver.parse(EXAMPLE_1);
    expect(() => solver.trace(network, { maxSteps: 0 })).toThrow(RangeError);
  });
});
