import { describe, expect, it } from 'vitest';
import { countInfiniteReachable, parseGardenMap } from '../../shared';
import {
  countInfinitePlotsForSteps,
  PART2_STEPS,
  solveInfiniteGarden,
} from './infiniteGarden';

const OFFICIAL_11X11 = [
  '...........',
  '.....###.#.',
  '.###.##..#.',
  '..#.#...#..',
  '....#.#....',
  '.##..S####.',
  '.##..#...#.',
  '.......##..',
  '.##.#.####.',
  '.##..##.##.',
  '...........',
].join('\n');

const EMPTY_5X5 = [
  '.....',
  '.....',
  '..S..',
  '.....',
  '.....',
].join('\n');

const ASYMMETRIC_7X7 = [
  '.......',
  '.#...#.',
  '....#..',
  '...S...',
  '.#.....',
  '....##.',
  '.......',
].join('\n');

function buildSerpentine21x21(): string {
  const grid = Array.from({ length: 21 }, () => Array.from({ length: 21 }, () => '.'));
  grid[10]![10] = 'S';
  for (let r = 1; r <= 9; r += 1) {
    for (let c = 1; c <= 9; c += 1) grid[r]![c] = '#';
  }
  grid[1]![2] = '.';
  for (let c = 2; c <= 8; c += 1) {
    grid[2]![c] = '.';
    grid[4]![c] = '.';
    grid[6]![c] = '.';
    grid[8]![c] = '.';
  }
  grid[3]![8] = '.';
  grid[5]![2] = '.';
  grid[7]![8] = '.';
  return grid.map((row) => row.join('')).join('\n');
}

describe('infiniteGarden', () => {
  it('rejects negative step counts with RangeError', () => {
    const map = parseGardenMap(EMPTY_5X5);
    expect(() => solveInfiniteGarden(map, -1n)).toThrow(RangeError);
  });

  it('returns frozen direct result 1n for 0n steps', () => {
    const map = parseGardenMap(OFFICIAL_11X11);
    const report = solveInfiniteGarden(map, 0n);
    expect(Object.isFrozen(report)).toBe(true);
    expect(report).toEqual({ mode: 'direct', steps: 0n, answer: 1n });
  });

  it('matches official 11x11 Part 2 checkpoints within margin and beyond', () => {
    const map = parseGardenMap(OFFICIAL_11X11);
    expect(solveInfiniteGarden(map, 3n)).toEqual({ mode: 'direct', steps: 3n, answer: 6n });
    expect(countInfinitePlotsForSteps(map, 6n)).toBe(16n);
    expect(countInfinitePlotsForSteps(map, 10n)).toBe(50n);
    expect(countInfinitePlotsForSteps(map, 50n)).toBe(1594n);
    expect(countInfinitePlotsForSteps(map, 100n)).toBe(6536n);
  });

  it('returns 0n after step 0 when S is isolated by rocks', () => {
    const map = parseGardenMap('###\n#S#\n###');
    expect(countInfinitePlotsForSteps(map, 0n)).toBe(1n);
    expect(countInfinitePlotsForSteps(map, 1n)).toBe(0n);
    expect(countInfinitePlotsForSteps(map, 2n)).toBe(0n);
  });

  it('solves periodic-ready maps directly below the 3*N extrapolation threshold', () => {
    const map = parseGardenMap(EMPTY_5X5);
    expect(solveInfiniteGarden(map, 10n)).toEqual({ mode: 'direct', steps: 10n, answer: 121n });
  });

  it('extrapolates exact quadratic progression for 5x5 empty grid at PART2_STEPS', () => {
    const map = parseGardenMap(EMPTY_5X5);
    const report = solveInfiniteGarden(map, PART2_STEPS);
    expect(Object.isFrozen(report)).toBe(true);
    expect(report.mode).toBe('quadratic');
    if (report.mode !== 'quadratic') throw new Error('Expected quadratic mode');
    expect(report.period).toBe(5n);
    expect(report.remainder).toBe(0n);
    expect(report.quotient).toBe(5_300_273n);
    expect(Object.isFrozen(report.samples)).toBe(true);
    expect(report.samples.map((s) => s.plots)).toEqual([1n, 36n, 121n, 256n]);
    expect(report.progression.secondDifference).toBe(50n);
    expect(report.answer).toBe(702_322_399_865_956n);
  });

  it('cross-checks asymmetric rock-bearing 7x7 quadratic extrapolation against direct BFS', () => {
    const map = parseGardenMap(ASYMMETRIC_7X7);
    const report31 = solveInfiniteGarden(map, 31n);
    expect(report31.mode).toBe('quadratic');
    expect(report31.answer).toBe(BigInt(countInfiniteReachable(map, 31)));

    const report28 = solveInfiniteGarden(map, 28n);
    expect(report28.mode).toBe('quadratic');
    expect(report28.answer).toBe(BigInt(countInfiniteReachable(map, 28)));
  });

  it('throws descriptive Error when non-periodic map exceeds MAX_INFINITE_BFS_CELLS', () => {
    const map = parseGardenMap(OFFICIAL_11X11);
    expect(() => solveInfiniteGarden(map, PART2_STEPS)).toThrow(
      /not quadratic-periodic-ready and exceeds direct BFS limit/,
    );
  });

  it('rejects delayed-stabilization 21x21 NW serpentine spiral at k=3 verification', () => {
    const map = parseGardenMap(buildSerpentine21x21());
    expect(map.isQuadraticPeriodicReady()).toBe(true);
    expect(() => solveInfiniteGarden(map, 2100n)).toThrow(
      /did not stabilize to a quadratic at k=3/,
    );
  });
});
