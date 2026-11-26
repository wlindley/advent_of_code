import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import {
  PART1_DEFAULT_CONFIG,
  type Racetrack,
  analyzeCheats,
  computeBfsDistances,
  parseRacetrack,
} from '../../shared';
import { createPart2Solver, solvePart2, solver } from './index';

const EXAMPLE_TRACK = [
  '###############',
  '#...#...#.....#',
  '#.#.#.#.#.###.#',
  '#S#...#.#.#...#',
  '#######.#.#.###',
  '#######.#.#...#',
  '#######.#.###.#',
  '###..E#...#...#',
  '###.#######.###',
  '#...###...#...#',
  '#.#####.#.###.#',
  '#.#...#.#.#...#',
  '#.#.#.#.#.#.###',
  '#...#...#...###',
  '###############',
].join('\n');

const LONG_DETOUR_TRACK = [
  `S${'.'.repeat(51)}`,
  `${'#'.repeat(51)}.`,
  `${'#'.repeat(51)}.`,
  `${'#'.repeat(51)}.`,
  `E${'.'.repeat(51)}`,
].join('\n');

function makeVerticalUBend(rows: number): Racetrack {
  const lines = ['S.'];
  for (let r = 1; r < rows - 1; r += 1) lines.push('#.');
  lines.push('E.');
  return parseRacetrack(lines.join('\n'));
}

describe('solvePart2', () => {
  it('solves the official 15x15 example across minSaving thresholds', () => {
    const track = parseRacetrack(EXAMPLE_TRACK);
    expect(solvePart2(track, 50)).toBe(285);
    expect(solvePart2(track, 72)).toBe(29);
    expect(solvePart2(track, 74)).toBe(7);
    expect(solvePart2(track, 76)).toBe(3);
    expect(solvePart2(track, 100)).toBe(0);
  });

  it('distinguishes Part 2 cheats from Part 1 on a 5x52 long-detour U-bend', () => {
    const track = parseRacetrack(LONG_DETOUR_TRACK);
    expect(computeBfsDistances(track).baseline).toBe(106);
    expect(solver.solve(track)).toBe(4);
    expect(analyzeCheats(computeBfsDistances(track), PART1_DEFAULT_CONFIG).totalCount).toBe(0);
  });

  it('enforces the exact d = 20 vs d = 21 Manhattan duration boundary', () => {
    const track20 = makeVerticalUBend(21);
    const track21 = makeVerticalUBend(22);
    expect(computeBfsDistances(track20).baseline).toBe(22);
    expect(solvePart2(track20, 1)).toBe(1);
    expect(solvePart2(track20, 2)).toBe(1);
    expect(solvePart2(track20, 3)).toBe(0);
    expect(computeBfsDistances(track21).baseline).toBe(23);
    expect(solvePart2(track21, 1)).toBe(0);
  });

  it('rejects invalid minSaving for both solvePart2 and createPart2Solver', () => {
    const track = parseRacetrack('S#E\n...');
    for (const invalid of [0, -5, 1.5, Number.NaN]) {
      expect(() => solvePart2(track, invalid)).toThrow(RangeError);
      expect(() => createPart2Solver(invalid)).toThrow(RangeError);
    }
  });
});

describe('createPart2Solver & default solver', () => {
  it('runs via executeSolver with fake Clock and produces bounded traces', () => {
    let ticks = 100;
    const fakeClock: Clock = { nowMs: () => (ticks += 15) };

    const exSolver = createPart2Solver(50);
    const exRun = executeSolver(exSolver, EXAMPLE_TRACK, fakeClock);
    expect(exRun.answer).toBe(285);
    expect(exRun.elapsedMs).toBe(15);
    expect(exRun.runtime).toBe('main-thread');

    const exParsed = exSolver.parse(EXAMPLE_TRACK);
    const fullTrace = exSolver.trace!(exParsed);
    expect(fullTrace.length).toBe(15);
    expect(fullTrace[fullTrace.length - 1]!.activeSaving).toBe(76);
    expect(fullTrace[fullTrace.length - 1]!.revealedCheatCount).toBe(285);
    expect(exSolver.trace!(exParsed, { maxSteps: 5 }).length).toBe(5);

    const defaultRun = executeSolver(solver, LONG_DETOUR_TRACK, fakeClock);
    expect(defaultRun.answer).toBe(4);
  });
});
