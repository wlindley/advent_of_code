import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = [
  'jqt: rhn xhk nvd', 'rsh: frs pzl lsr', 'xhk: hfx', 'cmg: qnr nvd lhk bvb',
  'rhn: xhk bvb hfx', 'bvb: xhk hfx', 'pzl: lsr hfx nvd', 'qnr: nvd',
  'ntq: jqt hfx bvb xhk', 'nvd: lhk', 'lsr: lhk', 'rzs: qnr cmg lsr rsh', 'frs: qnr lhk lsr',
].join('\n');

describe('AoC 2023 Day 25 Part 1 solver', () => {
  it('solves the 15-node example with product 54', () => {
    const graph = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(graph)).toBe(54);
    expect(executeSolver(solver, EXAMPLE_INPUT).answer).toBe(54);
  });

  it('produces bounded trace frames', () => {
    const graph = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace(graph);
    expect(full[0]!.phase).toBe('overview');
    expect(full[full.length - 1]!.phase).toBe('severed');
    const capped = solver.trace(graph, { maxSteps: 4 });
    expect(capped).toHaveLength(4);
    expect(capped[3]!.result.product).toBe(54);
  });

  it('rejects invalid input and 4-connected K5', () => {
    expect(() => solver.parse('')).toThrow();
    const k5 = solver.parse('a: b c d e\nb: c d e\nc: d e\nd: e');
    expect(() => solver.solve(k5)).toThrow(RangeError);
  });
});
