import { describe, expect, it } from 'vitest';
import { createStepCountPolicy, PART1_POLICY } from './policy';
import { TrenchMapSolver } from './solver';

const EXAMPLE = [
  '..#.#..#####.#.#.#.###.##.....###.##.#..###.####..#####..#....#..#..##..##',
  '#..######.###...####..#..#####..##..#.#####...##.#.#..#.##..#.#......#.###',
  '.######.###.####...#.##.##..#..#..#####.....#.#....###..#.##......#.....#.',
  '.#..#..##..#...##.######.####.####.#.#...#.......#..#.#.#...####.##.#.....',
  '.#..#...##.#.##..#...##.#.##..###.#......#.#.......#.#.#.####.###.##...#..',
  '...####.#..#..#.##.#....##..#.####....##...##..#...#......#.#.......#.....',
  '..##..####..#...#.#.#...##..#.#..###..#####........#..####......#..#',
  '',
  '#..#.',
  '#....',
  '##..#',
  '..#..',
  '..###',
].join('\n');

describe('TrenchMapSolver', () => {
  it('parses, solves, traces, and formats answers according to policy', () => {
    const solver = new TrenchMapSolver(PART1_POLICY);
    const parsed = solver.parse(EXAMPLE);

    expect(solver.policy.steps).toBe(2);
    expect(solver.solve(parsed)).toBe(35);
    expect(solver.formatAnswer(35)).toBe('35');

    const fullTrace = solver.trace(parsed);
    expect(fullTrace.map((f) => f.image.totalLitPixels)).toEqual([10, 24, 35]);

    const capped = solver.trace(parsed, { maxSteps: 2 });
    expect(capped).toHaveLength(2);
    expect(capped[0]!.step).toBe(0);
    expect(capped[1]!.step).toBe(2);
  });

  it('throws RangeError when final enhanced background remains lit', () => {
    const solver = new TrenchMapSolver(createStepCountPolicy(1));
    const input = solver.parse(`${'#'.repeat(512)}\n\n#`);
    expect(() => solver.solve(input)).toThrow(RangeError);
  });
});
