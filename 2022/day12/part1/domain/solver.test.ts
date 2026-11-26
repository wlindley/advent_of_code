import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { FIXED_START_CONDITION, solver } from './index';

const OFFICIAL_EXAMPLE = [
  'Sabqponm',
  'abcryxxl',
  'accszExk',
  'acctuvwj',
  'abdefghi',
].join('\n');

describe('Day 12 Part 1 FIXED_START_CONDITION', () => {
  it('is frozen, labeled Fixed start (S), and matches only map.startIndex', () => {
    expect(Object.isFrozen(FIXED_START_CONDITION)).toBe(true);
    expect(FIXED_START_CONDITION.label).toBe('Fixed start (S)');
    const map = solver.parse(OFFICIAL_EXAMPLE);
    expect(FIXED_START_CONDITION.matches(map, map.startIndex)).toBe(true);
    expect(FIXED_START_CONDITION.matches(map, map.startIndex + 1)).toBe(false);
    expect(FIXED_START_CONDITION.matches(map, map.goalIndex)).toBe(false);
  });
});

describe('Day 12 Part 1 solver', () => {
  it('is frozen and solves the official 5x8 example to 31', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    const map = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(map)).toBe(31);
  });

  it('produces trace ending at maxDistance with winningDistance = 31', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace!(map);
    const last = frames[frames.length - 1]!;
    expect(last.winningDistance).toBe(31);
    expect(last.winningStartIndex).toBe(map.startIndex);
    expect(last.winningStartReached).toBe(true);
    expect(last.isComplete).toBe(true);
  });

  it('solves 1x26 and 26x1 corridors to 25 steps', () => {
    const horiz = 'SbcdefghijklmnopqrstuvwxyE';
    expect(solver.solve(solver.parse(horiz))).toBe(25);
    expect(solver.solve(solver.parse(horiz.split('').join('\n')))).toBe(25);
  });

  it('throws when S cannot reach E and works via executeSolver', () => {
    expect(() => solver.solve(solver.parse('SE'))).toThrow(/No reachable start/);
    const fakeClock = { nowMs: () => 42 };
    const res = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(res.answer).toBe(31);
    expect(res.elapsedMs).toBe(0);
    expect(res.runtime).toBe('main-thread');
  });
});
