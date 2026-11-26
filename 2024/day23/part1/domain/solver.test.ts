import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { PART1_PREFIX, solvePart1, solver } from './index';

const EXAMPLE_INPUT = [
  'kh-tc', 'qp-kh', 'de-cg', 'ka-co', 'yn-aq', 'qp-ub', 'cg-tb', 'vc-aq',
  'tb-ka', 'wh-tc', 'yn-cg', 'kh-ub', 'ta-co', 'de-co', 'tc-td', 'tb-wq',
  'wh-td', 'ta-ka', 'td-qp', 'aq-cg', 'wq-ub', 'ub-vc', 'de-ta', 'wq-aq',
  'wq-vc', 'wh-yn', 'ka-de', 'kh-ta', 'co-tc', 'wh-qp', 'tb-vc', 'td-yn',
].join('\n');

describe('Day 23 Part 1 solver', () => {
  it('uses prefix "t" and solves the official Part 1 example', () => {
    expect(PART1_PREFIX).toBe('t');
    const graph = solver.parse(EXAMPLE_INPUT);
    expect(graph.nodeCount).toBe(16);
    expect(graph.edgeCount).toBe(32);
    expect(solvePart1(graph)).toBe(7);
    expect(solver.solve(graph)).toBe(7);
  });

  it('executes via shared executeSolver and produces bounded trace snapshots', () => {
    const execution = executeSolver(solver, EXAMPLE_INPUT);
    expect(execution.answer).toBe(7);
    expect(execution.runtime).toBe('main-thread');

    const frames = solver.trace!(solver.parse(EXAMPLE_INPUT), { maxSteps: 4 });
    expect(frames).toHaveLength(4);
    expect(frames[frames.length - 1]!.isComplete).toBe(true);
    expect(frames[frames.length - 1]!.totalCliques).toBe(7);
  });

  it('rejects empty or malformed raw inputs', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('aa-aa')).toThrow(RangeError);
    expect(() => solver.parse('invalid_line')).toThrow(RangeError);
  });
});
