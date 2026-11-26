import { describe, expect, it } from 'vitest';
import { computePassword } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '        ...#',
  '        .#..',
  '        #...',
  '        ....',
  '...#.......#',
  '........#...',
  '..#....#....',
  '..........#.',
  '        ...#....',
  '        .....#..',
  '        .#......',
  '        ......#.',
  '',
  '10R5L5R10L4R5L5',
].join('\n');

describe('Day 22 Part 1 solver', () => {
  it('solves the official example to 6032', () => {
    const input = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(input)).toBe(6032);
  });

  it('produces bounded trace ending at the solved password', () => {
    const input = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace(input, { maxSteps: 6 });
    expect(frames).toHaveLength(6);
    const last = frames[frames.length - 1]!;
    expect(computePassword(last.pose)).toBe(6032);
  });

  it('throws on invalid puzzle input', () => {
    expect(() => solver.parse('invalid-only-one-section')).toThrow();
  });
});
