import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { PART2_CONFIG, PART2_PRIZE_OFFSET, solver } from './index';

const EXAMPLE_INPUT = [
  'Button A: X+94, Y+34\nButton B: X+22, Y+67\nPrize: X=8400, Y=5400',
  'Button A: X+26, Y+66\nButton B: X+67, Y+21\nPrize: X=12748, Y=12176',
  'Button A: X+17, Y+86\nButton B: X+84, Y+37\nPrize: X=7870, Y=6450',
  'Button A: X+69, Y+23\nButton B: X+27, Y+71\nPrize: X=18641, Y=10279',
].join('\n\n');

class FakeClock implements Clock {
  private ticks = 0;

  nowMs(): number {
    this.ticks += 15;
    return this.ticks;
  }
}

describe('2024 Day 13 Part 2 solver', () => {
  it('exposes frozen Part 2 config, 10^13 offset, and solver via barrel', () => {
    expect(PART2_PRIZE_OFFSET).toBe(10_000_000_000_000n);
    expect(PART2_CONFIG.prizeOffset).toBe(PART2_PRIZE_OFFSET);
    expect(PART2_CONFIG.maxPresses).toBeNull();
    expect(Object.isFrozen(PART2_CONFIG)).toBe(true);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('solves the official 4-machine example to 875318608908n with expected trace outcomes', () => {
    const machines = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(machines)).toBe(875318608908n);

    const trace = solver.trace!(machines);
    expect(trace).toHaveLength(4);
    expect(trace[0]!.outcome).toEqual({ winnable: false, reason: 'non-integer' });
    expect(trace[1]!.outcome).toMatchObject({
      winnable: true,
      solution: { pressesA: 118679050709n, pressesB: 103199174542n },
    });
    expect(trace[1]!.tokens).toBe(459236326669n);
    expect(trace[2]!.outcome).toEqual({ winnable: false, reason: 'non-integer' });
    expect(trace[3]!.outcome).toMatchObject({
      winnable: true,
      solution: { pressesA: 102851800151n, pressesB: 107526881786n },
    });
    expect(trace[3]!.tokens).toBe(416082282239n);
  });

  it('integrates with executeSolver using a hand-written Clock fake and trace sampling', () => {
    const exec = executeSolver(solver, EXAMPLE_INPUT, new FakeClock());
    expect(exec.answer).toBe(875318608908n);
    expect(exec.elapsedMs).toBe(15);
    expect(exec.runtime).toBe('main-thread');

    const machines = solver.parse(EXAMPLE_INPUT);
    const sampled2 = solver.trace!(machines, { maxSteps: 2 });
    expect(sampled2).toHaveLength(2);
    expect(sampled2[0]!.machineIndex).toBe(0);
    expect(sampled2[1]!.machineIndex).toBe(3);
    expect(sampled2[1]!.cumulativeTokens).toBe(875318608908n);

    const sampled1 = solver.trace!(machines, { maxSteps: 1 });
    expect(sampled1).toHaveLength(1);
    expect(sampled1[0]!.machineIndex).toBe(3);
    expect(sampled1[0]!.cumulativeTokens).toBe(875318608908n);
    expect(() => solver.trace!(machines, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('handles unbounded >100 press wins, 10^13 collinear wins, and invalid inputs', () => {
    const unbounded = 'Button A: X+1, Y+2\nButton B: X+2, Y+1\nPrize: X=2, Y=2';
    expect(solver.solve(solver.parse(unbounded))).toBe(13_333_333_333_336n);

    const collinear = 'Button A: X+1, Y+1\nButton B: X+2, Y+2\nPrize: X=3, Y=3';
    expect(solver.solve(solver.parse(collinear))).toBe(5_000_000_000_004n);

    expect(() => solver.parse('   ')).toThrow('empty');
    expect(() => solver.parse('Button A: X+1, Y+2\nBad\nPrize: X=1, Y=1')).toThrow('Invalid Button B');
    expect(() => solver.parse('Button A: X+1, Y+2\nButton B: X+3, Y+4')).toThrow('3 lines');
  });
});
