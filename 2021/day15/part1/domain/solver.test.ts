import { describe, expect, it } from 'vitest';
import { PART1_POLICY } from '../../shared';
import { solver } from './index';

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

describe('2021 Day 15 Part 1 solver', () => {
  it('solves the 10x10 example with tileFactor 1 to 40', () => {
    const grid = solver.parse(EXAMPLE_INPUT);
    expect(solver.policy).toBe(PART1_POLICY);
    expect(solver.solve(grid)).toBe(40);
    expect(solver.formatAnswer(40)).toBe('40');
  });

  it('produces bounded wavefront + path trace frames ending at risk 40', () => {
    const grid = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace(grid, { maxSteps: 8 });
    expect(frames).toHaveLength(8);
    expect(frames[0]?.phase).toBe('wavefront');
    expect(frames[7]?.phase).toBe('path');
    expect(frames[7]?.revealedPathRisk).toBe(40);
  });
});
