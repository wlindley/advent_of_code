import { describe, expect, it } from 'vitest';
import { parseForestMap } from './forest';
import { LandingStep, PART2_SLOPES, Slope } from './slope';
import {
  countTreesOnSlope,
  evaluateTrajectory,
  multiplySlopeTreeCounts,
  TrajectoryRun,
} from './trajectory';

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

describe('TrajectoryRun', () => {
  it('computes totalSteps, treeCount, and openCount dynamically and freezes landings', () => {
    const slope = new Slope(3, 1);
    const source = [
      new LandingStep(1, slope, 11, false),
      new LandingStep(2, slope, 11, true),
      new LandingStep(3, slope, 11, false),
    ];
    const run = new TrajectoryRun(slope, source);
    source.pop();
    expect(Object.isFrozen(run)).toBe(true);
    expect(Object.isFrozen(run.landings)).toBe(true);
    expect(run.slope).toBe(slope);
    expect(run.totalSteps).toBe(3);
    expect(run.treeCount).toBe(1);
    expect(run.openCount).toBe(2);
  });

  it('rejects landings whose slope does not match the run slope', () => {
    const slope = new Slope(3, 1);
    const other = new Slope(1, 2);
    const mismatched = [new LandingStep(1, other, 11, true)];
    expect(() => new TrajectoryRun(slope, mismatched)).toThrow(RangeError);
  });
});

describe('evaluateTrajectory, countTreesOnSlope, and multiplySlopeTreeCounts', () => {
  it('evaluates the official 11x11 example and skips row 0 starting cell (0, 0)', () => {
    const forest = parseForestMap(OFFICIAL_EXAMPLE);
    const slope31 = new Slope(3, 1);
    const run = evaluateTrajectory(forest, slope31);
    expect(run.totalSteps).toBe(10);
    expect(run.treeCount).toBe(7);
    expect(run.openCount).toBe(3);
    expect(run.landings[0]?.row).toBe(1);
    expect(run.landings[0]?.col).toBe(3);
    expect(run.landings[0]?.isTree).toBe(false);
    expect(run.landings[1]?.isTree).toBe(true);
    expect(countTreesOnSlope(forest, slope31)).toBe(7);

    // Even when (0, 0) is a tree, only landings after (0, 0) are counted.
    const treeAtOrigin = parseForestMap('#..\n...\n...');
    expect(countTreesOnSlope(treeAtOrigin, new Slope(0, 1))).toBe(0);
    expect(evaluateTrajectory(treeAtOrigin, new Slope(0, 1)).treeCount).toBe(0);
  });

  it('handles 1-row forests with zero landings and matches all Part 2 slopes', () => {
    const singleRow = parseForestMap('#.#');
    const singleRun = evaluateTrajectory(singleRow, new Slope(3, 1));
    expect(singleRun.totalSteps).toBe(0);
    expect(singleRun.treeCount).toBe(0);
    expect(countTreesOnSlope(singleRow, new Slope(3, 1))).toBe(0);

    const forest = parseForestMap(OFFICIAL_EXAMPLE);
    const counts = PART2_SLOPES.map((slope) => countTreesOnSlope(forest, slope));
    expect(counts).toEqual([2, 7, 3, 4, 2]);
    expect(multiplySlopeTreeCounts(forest, PART2_SLOPES)).toBe(336n);
  });

  it('rejects empty slope list in multiplySlopeTreeCounts', () => {
    const forest = parseForestMap(OFFICIAL_EXAMPLE);
    expect(() => multiplySlopeTreeCounts(forest, [])).toThrow(RangeError);
  });
});
