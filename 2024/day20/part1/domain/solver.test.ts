import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { parseRacetrack } from '../../shared';
import { createPart1Solver, solvePart1, solver } from './index';

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
  `S${'.'.repeat(52)}`,
  `${'#'.repeat(52)}.`,
  `E${'.'.repeat(52)}`,
].join('\n');

describe('solvePart1', () => {
  it('solves the official example across minSaving thresholds', () => {
    const track = parseRacetrack(EXAMPLE_TRACK);
    expect(solvePart1(track, 2)).toBe(44);
    expect(solvePart1(track, 20)).toBe(5);
    expect(solvePart1(track, 100)).toBe(0);
  });

  it('rejects invalid minSaving', () => {
    const track = parseRacetrack('S#E\n...');
    expect(() => solvePart1(track, 0)).toThrow(RangeError);
    expect(() => createPart1Solver(0)).toThrow(RangeError);
  });
});

describe('createPart1Solver & default solver', () => {
  it('runs via executeSolver with fake Clock and builds traces with/without options', () => {
    let ticks = 100;
    const fakeClock: Clock = { nowMs: () => (ticks += 12) };

    const exSolver = createPart1Solver(2);
    const exRun = executeSolver(exSolver, EXAMPLE_TRACK, fakeClock);
    expect(exRun.answer).toBe(44);
    expect(exRun.elapsedMs).toBe(12);
    expect(exRun.runtime).toBe('main-thread');

    const exParsed = exSolver.parse(EXAMPLE_TRACK);
    expect(exSolver.trace!(exParsed).length).toBe(12);
    expect(exSolver.trace!(exParsed, { maxSteps: 4 }).length).toBe(4);

    const defaultRun = executeSolver(solver, LONG_DETOUR_TRACK, fakeClock);
    expect(defaultRun.answer).toBe(3);
  });
});
