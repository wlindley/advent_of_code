import { describe, expect, it } from 'vitest';
import { parseOctopusGrid } from './parser';
import {
  createFirstSyncPolicy,
  createFixedStepsPolicy,
  DEFAULT_MAX_SYNC_STEPS,
  FIRST_SYNC_STEP_POLICY,
  TOTAL_FLASHES_100_POLICY,
} from './policy';

const OFFICIAL_10X10 = [
  '5483143223',
  '2745854711',
  '5264556173',
  '6141336146',
  '6357385478',
  '4167524645',
  '2176841721',
  '6882881134',
  '4846848554',
  '5283751526',
].join('\n');

describe('OctopusPolicy', () => {
  it('computes 10-step (204) and 100-step (1656) flash totals on the official 10x10 grid', () => {
    const grid = parseOctopusGrid(OFFICIAL_10X10);
    const p10 = createFixedStepsPolicy(10);
    expect(p10.id).toBe('fixed-steps-10');
    expect(p10.label).toBe('10 Steps');
    expect(p10.metricLabel).toBe('Total Flashes');
    expect(p10.extractAnswer(p10.simulate(grid))).toBe(204);

    expect(TOTAL_FLASHES_100_POLICY.id).toBe('fixed-steps-100');
    expect(TOTAL_FLASHES_100_POLICY.extractAnswer(TOTAL_FLASHES_100_POLICY.simulate(grid))).toBe(1656);
  });

  it('finds first synchronization at step 195 and checks exact maxSteps boundary', () => {
    expect(DEFAULT_MAX_SYNC_STEPS).toBe(100_000);
    const grid = parseOctopusGrid(OFFICIAL_10X10);
    expect(FIRST_SYNC_STEP_POLICY.id).toBe('first-sync-step');
    expect(FIRST_SYNC_STEP_POLICY.metricLabel).toBe('Step Flashes');
    const history = FIRST_SYNC_STEP_POLICY.simulate(grid);
    expect(FIRST_SYNC_STEP_POLICY.extractAnswer(history)).toBe(195);

    const exact = createFirstSyncPolicy(195);
    expect(exact.extractAnswer(exact.simulate(grid))).toBe(195);

    const tooLow = createFirstSyncPolicy(194);
    expect(() => tooLow.simulate(grid)).toThrow(RangeError);
  });

  it('throws RangeError on non-synchronizing cycle "05" for bounded and default sync policies', () => {
    const cycleGrid = parseOctopusGrid('05');
    expect(() => createFirstSyncPolicy(20).simulate(cycleGrid)).toThrow(RangeError);
    expect(() => FIRST_SYNC_STEP_POLICY.simulate(cycleGrid)).toThrow(RangeError);
  });

  it('rejects non-positive or non-integer policy parameters', () => {
    expect(() => createFixedStepsPolicy(0)).toThrow(RangeError);
    expect(() => createFixedStepsPolicy(-3)).toThrow(RangeError);
    expect(() => createFixedStepsPolicy(2.5)).toThrow(RangeError);
    expect(() => createFirstSyncPolicy(0)).toThrow(RangeError);
    expect(() => createFirstSyncPolicy(Number.NaN)).toThrow(RangeError);
  });
});
