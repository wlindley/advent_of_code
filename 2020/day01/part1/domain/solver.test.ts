import { describe, expect, it } from 'vitest';
import { solver } from './index';

const EXAMPLE_INPUT = '1721\n979\n366\n299\n675\n1456';

describe('2020 day01 part1 solver', () => {
  it('parses and solves the official example to 514579', () => {
    const report = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(report)).toBe(514579);
  });

  it('throws when no pair sums to 2020', () => {
    const report = solver.parse('100\n200\n300');
    expect(() => solver.solve(report)).toThrow(RangeError);
  });

  it('produces uncapped and maxSteps-capped traces matching the solution', () => {
    const report = solver.parse('100\n300\n1720\n2100');
    const full = solver.trace!(report);
    expect(full.length).toBeGreaterThan(2);
    expect(full.at(-1)!.verdict).toBe('match');
    expect(full.at(-1)!.product).toBe(300 * 1720);

    const capped = solver.trace!(report, { maxSteps: 2 });
    expect(capped).toHaveLength(2);
    expect(capped.at(-1)!.verdict).toBe('match');
  });
});
