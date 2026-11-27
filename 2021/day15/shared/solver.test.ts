import { describe, expect, it } from 'vitest';
import { PART1_POLICY, PART2_POLICY } from './cavern';
import { CavernRiskSolver } from './solver';

const EXAMPLE_INPUT = [
  '1163751742',
  '1381373672',
  '2136511328',
  '3694931569',
  '7463417111',
  '1319128137',
  '1359912421',
  '3125421639',
  '1293138521',
  '2311944581',
].join('\n');

describe('CavernRiskSolver', () => {
  it('parses, analyzes, solves, traces, and formats answers for Part 1 and Part 2 policies', () => {
    const part1 = new CavernRiskSolver(PART1_POLICY);
    expect(Object.isFrozen(part1)).toBe(true);
    expect(part1.policy).toBe(PART1_POLICY);

    const grid = part1.parse(EXAMPLE_INPUT);
    const analysis = part1.analyze(grid);
    expect(analysis.totalRisk).toBe(40);
    expect(part1.solve(grid)).toBe(40);
    expect(part1.formatAnswer(40)).toBe('40');

    const frames = part1.trace(grid, { maxSteps: 6 });
    expect(frames).toHaveLength(6);
    expect(frames[5]?.revealedPathRisk).toBe(40);

    const part2 = new CavernRiskSolver(PART2_POLICY);
    expect(part2.solve(grid)).toBe(315);
    expect(part2.trace(grid)).toHaveLength(48);
  });
});
