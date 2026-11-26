import { describe, expect, it } from 'vitest';
import { parseForestMap } from './forest';
import { PART1_SLOPES, PART2_SLOPES, Slope } from './slope';
import { createTobogganSolver } from './solverFactory';
import { DEFAULT_MAX_TRACE_STEPS, traceTrajectories } from './trace';

const OFFICIAL_EXAMPLE = [
  '..##.......',
  '#...#...#..',
  '.#....#..#.',
  '..#.#...#.#',
  '.#...##..#.',
  '..#.##.....',
  '.#.#.#....#',
  '.#........#',
  '#.##...#...',
  '#...##....#',
  '.#..#...#.#',
].join('\n');

describe('traceTrajectories', () => {
  it('emits per-row frames from row 0 start through the final row', () => {
    const forest = parseForestMap(OFFICIAL_EXAMPLE);
    const frames = traceTrajectories(forest, PART2_SLOPES);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(11);

    const start = frames[0]!;
    expect(start.row).toBe(0);
    expect(start.totalRows).toBe(11);
    expect(start.treeProduct).toBe(0n);
    for (let i = 0; i < start.slopes.length; i += 1) {
      expect(start.slopes[i]!.stepsCompleted).toBe(0);
      expect(start.slopes[i]!.treeCount).toBe(0);
      expect(start.slopes[i]!.activeLanding).toBeNull();
    }

    // At row 1, down=2 slope skips landing while down=1 slopes record step 1.
    const row1 = frames[1]!;
    expect(row1.slopes[1]!.stepsCompleted).toBe(1);
    expect(row1.slopes[1]!.activeLanding?.row).toBe(1);
    expect(row1.slopes[4]!.stepsCompleted).toBe(0);
    expect(row1.slopes[4]!.activeLanding).toBeNull();

    const end = frames[frames.length - 1]!;
    expect(end.row).toBe(10);
    expect(end.slopes.map((s) => s.treeCount)).toEqual([2, 7, 3, 4, 2]);
    expect(end.treeProduct).toBe(336n);
  });

  it('caps trace frames to maxSteps while preserving final cumulative counts', () => {
    const forest = parseForestMap(OFFICIAL_EXAMPLE);
    const capped = traceTrajectories(forest, PART1_SLOPES, 4);
    expect(capped).toHaveLength(4);
    expect(capped[0]!.row).toBe(0);
    expect(capped[capped.length - 1]!.row).toBe(10);
    expect(capped[capped.length - 1]!.treeProduct).toBe(7n);

    const singleFrame = traceTrajectories(forest, PART2_SLOPES, 1);
    expect(singleFrame).toHaveLength(1);
    expect(singleFrame[0]!.row).toBe(10);
    expect(singleFrame[0]!.treeProduct).toBe(336n);
  });

  it('validates slopes and maxSteps against DEFAULT_MAX_TRACE_STEPS', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const forest = parseForestMap(OFFICIAL_EXAMPLE);
    expect(() => traceTrajectories(forest, [])).toThrow(RangeError);
    expect(() => traceTrajectories(forest, PART1_SLOPES, 0)).toThrow(RangeError);
    expect(() => traceTrajectories(forest, PART1_SLOPES, -2)).toThrow(RangeError);
    expect(() => traceTrajectories(forest, PART1_SLOPES, 1.5)).toThrow(RangeError);
  });
});

describe('createTobogganSolver', () => {
  it('validates slopes at factory creation and clones input array defensively', () => {
    expect(() => createTobogganSolver([])).toThrow(RangeError);
    const slopes = [new Slope(3, 1)];
    const solver = createTobogganSolver(slopes);
    slopes.push(new Slope(1, 1));
    const forest = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(forest)).toBe(7n);
    expect(solver.trace!(forest)).toHaveLength(11);
    expect(solver.trace!(forest, { maxSteps: 3 })).toHaveLength(3);
  });
});
