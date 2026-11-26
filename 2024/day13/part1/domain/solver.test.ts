import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solveClawMachine } from '../../shared';
import { PART1_CONFIG, solver } from './index';

const EXAMPLE_INPUT = [
  'Button A: X+94, Y+34',
  'Button B: X+22, Y+67',
  'Prize: X=8400, Y=5400',
  '',
  'Button A: X+26, Y+66',
  'Button B: X+67, Y+21',
  'Prize: X=12748, Y=12176',
  '',
  'Button A: X+17, Y+86',
  'Button B: X+84, Y+37',
  'Prize: X=7870, Y=6450',
  '',
  'Button A: X+69, Y+23',
  'Button B: X+27, Y+71',
  'Prize: X=18641, Y=10279',
].join('\n');

describe('2024 Day 13 Part 1 solver', () => {
  it('solves the official 4-machine example to 480n with expected per-machine outcomes', () => {
    const machines = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(machines)).toBe(480n);

    const outcomes = machines.map((m) => solveClawMachine(m, PART1_CONFIG));
    expect(outcomes[0]).toMatchObject({ winnable: true, solution: { pressesA: 80n, pressesB: 40n } });
    expect(outcomes[1]).toEqual({ winnable: false, reason: 'non-integer' });
    expect(outcomes[2]).toMatchObject({ winnable: true, solution: { pressesA: 38n, pressesB: 86n } });
    expect(outcomes[3]).toEqual({ winnable: false, reason: 'non-integer' });
  });

  it('integrates with executeSolver using a hand-written Clock fake and supports trace sampling', () => {
    let ticks = 0;
    const fakeClock: Clock = { nowMs: () => (ticks += 12) };
    const exec = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(exec.answer).toBe(480n);
    expect(exec.elapsedMs).toBe(12);
    expect(exec.runtime).toBe('main-thread');

    const machines = solver.parse(EXAMPLE_INPUT);
    const trace = solver.trace!(machines, { maxSteps: 2 });
    expect(trace).toHaveLength(2);
    expect(trace[0]!.machineIndex).toBe(0);
    expect(trace[1]!.machineIndex).toBe(3);
    expect(trace[1]!.cumulativeTokens).toBe(480n);
  });
});
