import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import {
  createFirstRepeatPeriodPolicy,
  createTotalEnergyPolicy,
  FIRST_REPEAT_PERIOD_POLICY,
  TOTAL_ENERGY_1000_POLICY,
} from './policies';
import { NBodySolver } from './solver';

const EXAMPLE_1 = [
  '<x=-1, y=0, z=2>',
  '<x=2, y=-10, z=-7>',
  '<x=4, y=-8, z=8>',
  '<x=3, y=5, z=-1>',
].join('\n');

const EXAMPLE_2 = [
  '<x=-8, y=-10, z=0>',
  '<x=5, y=5, z=10>',
  '<x=2, y=-7, z=3>',
  '<x=9, y=-8, z=-3>',
].join('\n');

describe('2019 Day 12 policies & NBodySolver', () => {
  it('validates policy factory bounds', () => {
    expect(() => createTotalEnergyPolicy(-1)).toThrow(RangeError);
    expect(() => createTotalEnergyPolicy(1.5)).toThrow(RangeError);
    expect(() => createFirstRepeatPeriodPolicy(0)).toThrow(RangeError);
    expect(() => createFirstRepeatPeriodPolicy(2.5)).toThrow(RangeError);
  });

  it('solves, traces, and formats answers via energy policy', () => {
    const solver10 = new NBodySolver(createTotalEnergyPolicy(10));
    expect(solver10.policy.id).toBe('total-energy-10');
    expect(solver10.policy.label).toBe('Total Energy @ 10 Steps');
    const result = executeSolver(solver10, EXAMPLE_1);
    expect(result.answer).toBe(179);
    expect(solver10.formatAnswer(result.answer)).toBe('179');

    const parsed = solver10.parse(EXAMPLE_1);
    const defaultTrace = solver10.trace(parsed);
    expect(defaultTrace.length).toBe(11);
    const cappedTrace = solver10.trace(parsed, { maxSteps: 5 });
    expect(cappedTrace.length).toBe(5);
    expect(cappedTrace[4]!.step).toBe(10);

    expect(TOTAL_ENERGY_1000_POLICY.id).toBe('total-energy-1000');
  });

  it('solves, traces, and formats answers via first-repeat policy', () => {
    const solver = new NBodySolver(FIRST_REPEAT_PERIOD_POLICY);
    expect(solver.policy.id).toBe('first-repeat-period');
    expect(solver.policy.label).toBe('First Repeat Period');

    const r1 = executeSolver(solver, EXAMPLE_1);
    expect(r1.answer).toBe(2772n);
    expect(solver.formatAnswer(r1.answer)).toBe('2772');

    const r2 = executeSolver(solver, EXAMPLE_2);
    expect(r2.answer).toBe(4686774924n);

    const parsed = solver.parse(EXAMPLE_1);
    const defaultTrace = solver.trace(parsed);
    expect(defaultTrace.length).toBe(49);
    const cappedTrace = solver.trace(parsed, { maxSteps: 8 });
    expect(cappedTrace.length).toBe(8);
    expect(cappedTrace[7]!.phase).toBe('lcm-complete');
  });
});
