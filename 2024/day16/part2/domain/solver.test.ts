import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { part2Objective, solver } from './index';

class FakeClock implements Clock {
  private readonly ticks: readonly number[];
  private index = 0;
  constructor(ticks: readonly number[]) { this.ticks = ticks; }
  nowMs(): number { return this.ticks[this.index++] ?? this.ticks[this.ticks.length - 1] ?? 0; }
}

const EXAMPLE_1 = [
  '###############',
  '#.......#....E#',
  '#.#.###.#.###.#',
  '#.....#.#...#.#',
  '#.###.#####.#.#',
  '#.#.#.......#.#',
  '#.#.#####.###.#',
  '#...........#.#',
  '###.#.#####.#.#',
  '#...#.....#.#.#',
  '#.#.#.###.#.#.#',
  '#.....#...#.#.#',
  '#.###.#.#.#.#.#',
  '#S..#.....#...#',
  '###############',
].join('\n');

const EXAMPLE_2 = [
  '#################',
  '#...#...#...#..E#',
  '#.#.#.#.#.#.#.#.#',
  '#.#.#.#...#...#.#',
  '#.#.#.#.###.#.#.#',
  '#...#.#.#.....#.#',
  '#.#.#.#.#.#####.#',
  '#.#...#.#.#.....#',
  '#.#.#####.#.###.#',
  '#.#.#.......#...#',
  '#.#.###.#####.###',
  '#.#.#...#.....#.#',
  '#.#.#.#####.###.#',
  '#.#.#.........#.#',
  '#.#.#.#########.#',
  '#S#.............#',
  '#################',
].join('\n');

describe('2024 Day 16 Part 2 solver', () => {
  it('solves Example 1 (45) and Example 2 (64)', () => {
    expect(solver.solve(solver.parse(EXAMPLE_1))).toBe(45);
    expect(solver.solve(solver.parse(EXAMPLE_2))).toBe(64);
  });

  it('executes via executeSolver with FakeClock', () => {
    const exec = executeSolver(solver, EXAMPLE_1, new FakeClock([10, 15]));
    expect(exec).toEqual({ answer: 45, elapsedMs: 5, runtime: 'main-thread' });
  });

  it('produces bounded trace frames with optimal mask revealed only on final complete frame', () => {
    const frames = solver.trace?.(solver.parse(EXAMPLE_1), { maxSteps: 12 });
    expect(frames).toBeDefined();
    expect(frames!.length).toBe(12);
    for (let i = 0; i < 11; i += 1) {
      expect(frames![i]!.showOptimalMask).toBe(false);
    }
    const last = frames![11]!;
    expect(last.phase).toBe('complete');
    expect(last.showOptimalMask).toBe(true);
    expect(last.context.analysis.optimalTileCount).toBe(45);
  });

  it('counts seats for direct East corridor, 180-degree start turn, and suboptimal bypass exclusion', () => {
    expect(solver.solve(solver.parse('#####\n#S.E#\n#####'))).toBe(3);
    expect(solver.solve(solver.parse('#####\n#E.S#\n#####'))).toBe(3);
    expect(solver.solve(solver.parse('#######\n#S...E#\n#.#.###\n#...###\n#######'))).toBe(5);
  });

  it('unions all optimal branches across symmetric diamond fork and multi-heading E ties', () => {
    const fork = '########\n#....###\n#S##..E#\n#....###\n########';
    expect(solver.solve(solver.parse(fork))).toBe(12);
    const multiHeadingE = '#####\n#...#\n#S#E#\n#...#\n#####';
    expect(solver.solve(solver.parse(multiHeadingE))).toBe(8);
    expect(part2Objective.extractAnswer).toBeTypeOf('function');
  });

  it('throws when end tile E is unreachable from start tile S', () => {
    const unreachable = solver.parse('#####\n#S#E#\n#####');
    expect(() => solver.solve(unreachable)).toThrow('End tile E is unreachable from start tile S');
  });

  it('throws on malformed inputs missing tiles or empty grid', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('####\n#.E#\n####')).toThrow();
    expect(() => solver.parse('####\n#S.#\n####')).toThrow();
  });
});
