import { describe, expect, it } from 'vitest';
import { solver } from './index';

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

describe('2021 Day 20 Part 1 solver', () => {
  it('solves the official example in 2 passes', () => {
    const parsed = solver.parse(EXAMPLE);
    expect(solver.policy.steps).toBe(2);
    expect(solver.solve(parsed)).toBe(35);
    expect(solver.formatAnswer(35)).toBe('35');
  });

  it('returns finite lit count after 2 passes for blinking (1, 0) algorithms', () => {
    const table = `#${'.'.repeat(511)}`;
    const parsed = solver.parse(`${table}\n\n#`);
    const frames = solver.trace(parsed);
    expect(frames).toHaveLength(3);
    expect(frames[0]!.image.background).toBe(0);
    expect(frames[1]!.image.background).toBe(1);
    expect(frames[2]!.image.background).toBe(0);
    expect(solver.solve(parsed)).toBe(frames[2]!.image.totalLitPixels);
  });

  it('throws RangeError when sticky (1, 1) algorithm leaves final void lit', () => {
    const parsed = solver.parse(`${'#'.repeat(512)}\n\n#`);
    expect(() => solver.solve(parsed)).toThrow(RangeError);
  });

  it('supports trace with omitted and explicit maxSteps', () => {
    const parsed = solver.parse(EXAMPLE);
    const full = solver.trace(parsed);
    expect(full.map((f) => f.image.totalLitPixels)).toEqual([10, 24, 35]);

    const capped = solver.trace(parsed, { maxSteps: 2 });
    expect(capped).toHaveLength(2);
    expect(capped[0]!.step).toBe(0);
    expect(capped[1]!.step).toBe(2);
  });
});
