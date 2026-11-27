import { describe, expect, it } from 'vitest';
import { solver } from './index';

const EXAMPLE_INPUT = [
  'NNCB',
  '',
  'CH -> B',
  'HH -> N',
  'CB -> H',
  'NH -> C',
  'HB -> C',
  'HC -> B',
  'HN -> C',
  'NN -> C',
  'BH -> H',
  'NC -> B',
  'NB -> B',
  'BN -> B',
  'BB -> N',
  'BC -> B',
  'CC -> N',
  'CN -> C',
].join('\n');

describe('2021 Day 14 Part 1 solver', () => {
  it('solves the official example after 10 insertion steps to 1588n', () => {
    const formula = solver.parse(EXAMPLE_INPUT);
    expect(solver.steps).toBe(10);
    expect(solver.solve(formula)).toBe(1588n);
  });

  it('produces 11 trace frames from step 0 to step 10 and honors maxSteps', () => {
    const formula = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace(formula);
    expect(frames).toHaveLength(11);
    expect(frames[0]?.step).toBe(0);
    expect(frames[10]?.step).toBe(10);
    expect(frames[10]?.spread).toBe(1588n);

    const sampled = solver.trace(formula, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[0]?.step).toBe(0);
    expect(sampled[2]?.step).toBe(10);
  });
});
