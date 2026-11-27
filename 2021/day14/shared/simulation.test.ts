import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PART1_STEPS,
  PART2_STEPS,
  PolymerTraceFrame,
  PolymerizationSolver,
  tracePolymerization,
} from './simulation';

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

describe('PolymerizationSolver and tracePolymerization', () => {
  it('solves Part 1 (10 steps) and Part 2 (40 steps) on the official example', () => {
    const part1 = new PolymerizationSolver(PART1_STEPS);
    expect(Object.isFrozen(part1)).toBe(true);
    expect(part1.steps).toBe(10);
    const formula = part1.parse(EXAMPLE_INPUT);
    const ans1 = part1.solve(formula);
    expect(ans1).toBe(1588n);
    expect(part1.formatAnswer(ans1)).toBe('1588');

    const part2 = new PolymerizationSolver(PART2_STEPS);
    expect(part2.steps).toBe(40);
    const ans2 = part2.solve(formula);
    expect(ans2).toBe(2188189693529n);
    expect(part2.formatAnswer(ans2)).toBe('2188189693529');
  });

  it('exposes frozen trace frames with derived polymer metrics', () => {
    const solver = new PolymerizationSolver(PART1_STEPS);
    const formula = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace(formula);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(41);
    expect(frames).toHaveLength(11);
    expect(Object.isFrozen(frames)).toBe(true);

    const first = frames[0]!;
    expect(first).toBeInstanceOf(PolymerTraceFrame);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.step).toBe(0);
    expect(first.totalLength).toBe(4n);
    expect(first.mostCommon).toEqual({ element: 'N', count: 2n });
    expect(first.leastCommon).toEqual({ element: 'C', count: 1n });
    expect(first.spread).toBe(1n);
    expect(first.activePairCount).toBe(3);
    expect(first.insertionsNext).toBe(3n);
    expect(first.activeReactions).toHaveLength(3);

    const last = frames[10]!;
    expect(last.step).toBe(10);
    expect(last.totalLength).toBe(3073n);
    expect(last.spread).toBe(1588n);
  });

  it('respects step=0, maxSteps sampling, and rejects invalid arguments', () => {
    const solver = new PolymerizationSolver(PART1_STEPS);
    const formula = solver.parse(EXAMPLE_INPUT);

    const zero = tracePolymerization(formula, 0);
    expect(zero).toHaveLength(1);
    expect(zero[0]?.step).toBe(0);

    const sampled = solver.trace(formula, { maxSteps: 5 });
    expect(sampled).toHaveLength(5);
    expect(sampled[0]?.step).toBe(0);
    expect(sampled[4]?.step).toBe(10);

    const single = tracePolymerization(formula, 10, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.step).toBe(10);

    expect(() => tracePolymerization(formula, -1)).toThrow(RangeError);
    expect(() => tracePolymerization(formula, 10, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => new PolymerizationSolver(-1)).toThrow(RangeError);
  });
});
