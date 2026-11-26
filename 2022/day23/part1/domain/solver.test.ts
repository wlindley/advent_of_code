import { describe, expect, it } from 'vitest';
import { solver } from './index';

const SMALL_FIVE = ['.....', '..##.', '..#..', '.....', '..##.', '.....'].join('\n');

const OFFICIAL_22 = [
  '....#..',
  '..###.#',
  '#...#.#',
  '.#...##',
  '#.###..',
  '##.#.##',
  '.#..#..',
].join('\n');

describe('Day 23 Part 1 solver', () => {
  it('solves the 5-elf example (25) and official 22-elf example (110)', () => {
    expect(solver.solve(solver.parse(SMALL_FIVE))).toBe(25);
    expect(solver.solve(solver.parse(OFFICIAL_22))).toBe(110);
  });

  it('produces default and bounded traces ending at emptyGroundCount 110', () => {
    const elves = solver.parse(OFFICIAL_22);
    const full = solver.trace(elves);
    expect(full).toHaveLength(11);
    expect(full[0]!.round).toBe(0);
    expect(full[10]!.round).toBe(10);
    expect(full[10]!.emptyGroundCount).toBe(110);

    const capped = solver.trace(elves, { maxSteps: 5 });
    expect(capped).toHaveLength(5);
    expect(capped[4]!.emptyGroundCount).toBe(110);
  });

  it('rejects invalid puzzle inputs', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('...\n...')).toThrow();
  });
});
