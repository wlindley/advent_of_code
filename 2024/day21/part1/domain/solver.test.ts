import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { PART1_DIRECTIONAL_ROBOTS, parseDoorCodes } from '../../shared';
import { PART1_CONFIG, solvePart1, solver } from './index';

const OFFICIAL_EXAMPLE = ['029A', '980A', '179A', '456A', '379A'].join('\n');

describe('Day 21 Part 1 solver', () => {
  it('configures 2 directional robots and solves the official example', () => {
    expect(PART1_CONFIG.directionalRobots).toBe(PART1_DIRECTIONAL_ROBOTS);
    const codes = parseDoorCodes(OFFICIAL_EXAMPLE);
    expect(solvePart1(codes)).toBe(126384n);
  });

  it('executes via executeSolver with fake Clock and builds bounded traces', () => {
    let ticks = 50;
    const fakeClock: Clock = { nowMs: () => (ticks += 7) };
    const run = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(run.answer).toBe(126384n);
    expect(run.elapsedMs).toBe(7);
    expect(run.runtime).toBe('main-thread');

    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.trace!(parsed)).toHaveLength(9);
    expect(solver.trace!(parsed, { maxSteps: 4 })).toHaveLength(4);
  });
});
