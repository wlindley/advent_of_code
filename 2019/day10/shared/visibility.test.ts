import { describe, expect, it } from 'vitest';
import { AsteroidMap } from './asteroidMap';
import {
  analyzeVisibility,
  computeVaporizationSchedule,
  computeVisibilityCounts,
  findVisibleTargets,
  VisibilityAnalysis,
} from './visibility';

const EX1 = ['.#..#', '.....', '#####', '....#', '...##'].join('\n');
const EX2 = [
  '......#.#.', '#..#.#....', '..#######.', '.#.#.###..', '.#..#.....',
  '..#....#.#', '#..#....#.', '.##.#..###', '##...#..#.', '.#....####',
].join('\n');
const EX3 = [
  '#.#...#.#.', '.###....#.', '.#....#...', '##.#.#.#.#', '....#.#.#.',
  '.##..###.#', '..#...##..', '..##....##', '......#...', '.####.###.',
].join('\n');
const EX4 = [
  '.#..#..###', '####.###.#', '....###.#.', '..###.##.#', '##.##.#.#.',
  '....###..#', '..#.#..#.#', '#..#.#.###', '.##...##.#', '.....#.#..',
].join('\n');
const EX5 = [
  '.#..##.###...#######', '##.############..##.', '.#.######.########.#', '.###.#######.####.#.',
  '#####.##.#.##.###.##', '..#####..#.#########', '####################', '#.####....###.#.#.##',
  '##.#################', '#####.##.###..####..', '..######..##.#######', '####.##.####...##..#',
  '.#####..#.######.###', '##...#.##########...', '#.##########.#######', '.####.#.###.###.#.##',
  '....##.##.###..#####', '.#.#.###########.###', '#.#.#.#####.####.###', '###.##.####.##.#..##',
].join('\n');
const SMALL_LASER = [
  '.#....#####...#..', '##...##.#####..##', '##...#...#.#####.',
  '..#.....#...###..', '..#.#.....#....##',
].join('\n');

describe('visibility counts and Part 1 station selection', () => {
  it('handles single-asteroid map and all 4 collinear orientations (gcd = 2)', () => {
    const single = analyzeVisibility(AsteroidMap.parse('#'));
    expect(single.counts).toEqual([0]);
    expect(single.bestIndex).toBe(0);
    expect(single.bestDetectedCount).toBe(0);
    expect(single.minDetectedCount).toBe(0);
    expect(single.maxDetectedCount).toBe(0);

    // 5x5 star with center (2,2) occluded in horizontal, vertical, and both diagonals (gcd=2)
    const cross = AsteroidMap.parse(['#.#.#', '.###.', '#####', '.###.', '#.#.#'].join('\n'));
    const centerIdx = cross.asteroids.findIndex((p) => p.x === 2 && p.y === 2);
    const counts = computeVisibilityCounts(cross);
    expect(counts[centerIdx]).toBe(8);
    expect(() => new VisibilityAnalysis(cross, [1], 0)).toThrow(RangeError);
  });

  it('handles non-square 10x2 and 2x10 maps and row-major tie breaking', () => {
    const wide = analyzeVisibility(AsteroidMap.parse('##########\n..........'));
    expect(wide.bestDetectedCount).toBe(2);
    expect(wide.bestStation).toEqual({ x: 1, y: 0 });
    expect(wide.minDetectedCount).toBe(1);

    const tall = analyzeVisibility(AsteroidMap.parse('#.\n'.repeat(10)));
    expect(tall.bestDetectedCount).toBe(2);
    expect(tall.bestStation).toEqual({ x: 0, y: 1 });

    const two = analyzeVisibility(AsteroidMap.parse('#.#'));
    expect(two.bestIndex).toBe(0);
    expect(two.bestStation).toEqual({ x: 0, y: 0 });
  });

  it('matches all five official AoC 2019 Day 10 Part 1 examples', () => {
    const a1 = analyzeVisibility(AsteroidMap.parse(EX1));
    expect([a1.bestStation.x, a1.bestStation.y, a1.bestDetectedCount]).toEqual([3, 4, 8]);
    expect(a1.maxDetectedCount).toBe(8);
    expect(a1.minDetectedCount).toBeLessThan(8);
    const a2 = analyzeVisibility(AsteroidMap.parse(EX2));
    expect([a2.bestStation.x, a2.bestStation.y, a2.bestDetectedCount]).toEqual([5, 8, 33]);
    const a3 = analyzeVisibility(AsteroidMap.parse(EX3));
    expect([a3.bestStation.x, a3.bestStation.y, a3.bestDetectedCount]).toEqual([1, 2, 35]);
    const a4 = analyzeVisibility(AsteroidMap.parse(EX4));
    expect([a4.bestStation.x, a4.bestStation.y, a4.bestDetectedCount]).toEqual([6, 3, 41]);
    const a5 = analyzeVisibility(AsteroidMap.parse(EX5));
    expect([a5.bestStation.x, a5.bestStation.y, a5.bestDetectedCount]).toEqual([11, 13, 210]);
  });
});

describe('visible targets and Part 2 vaporization schedule', () => {
  it('validates stationIndex and handles 1-asteroid vaporization', () => {
    const single = AsteroidMap.parse('#');
    expect(findVisibleTargets(single, 0)).toEqual([]);
    expect(computeVaporizationSchedule(single, 0)).toEqual([]);
    expect(() => findVisibleTargets(single, -1)).toThrow(RangeError);
    expect(() => computeVaporizationSchedule(single, 1)).toThrow(RangeError);
  });

  it('vaporizes the 17x5 laser map and 20x20 EX5 checkpoints in exact clockwise order', () => {
    const small = AsteroidMap.parse(SMALL_LASER);
    const stationIdx = small.asteroids.findIndex((p) => p.x === 8 && p.y === 3);
    const firstTargets = findVisibleTargets(small, stationIdx);
    expect(firstTargets[0]).toEqual({ x: 8, y: 1 });
    const smallSched = computeVaporizationSchedule(small, stationIdx);
    expect(smallSched).toHaveLength(small.asteroidCount - 1);
    expect(smallSched[0]!.target).toEqual({ x: 8, y: 1 });
    expect(smallSched[8]!.target).toEqual({ x: 15, y: 1 });
    expect(smallSched[smallSched.length - 1]!.target).toEqual({ x: 14, y: 3 });

    const ex5 = AsteroidMap.parse(EX5);
    const analysis = analyzeVisibility(ex5);
    const sched = computeVaporizationSchedule(ex5, analysis.bestIndex);
    expect(sched).toHaveLength(299);
    expect(sched[0]!.target).toEqual({ x: 11, y: 12 });
    expect(sched[0]!.order).toBe(1);
    expect(sched[0]!.sweepIndex).toBe(0);
    expect(sched[199]!.target).toEqual({ x: 8, y: 2 });
    expect(sched[199]!.coordinateCode).toBe(802);
    expect(sched[298]!.target).toEqual({ x: 11, y: 1 });
    expect(sched[298]!.coordinateCode).toBe(1101);
  });
});
