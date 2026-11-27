import { describe, expect, it } from 'vitest';
import {
  createStepCountPolicy,
  PART1_POLICY,
  PART1_STEPS,
  PART2_POLICY,
  PART2_STEPS,
} from './policy';

describe('EnhancementPolicy', () => {
  it('defines Part 1 and Part 2 step count policies', () => {
    expect(PART1_STEPS).toBe(2);
    expect(PART2_STEPS).toBe(50);
    expect(PART1_POLICY.steps).toBe(2);
    expect(PART2_POLICY.steps).toBe(50);
  });

  it('creates validated custom step policies and rejects invalid counts', () => {
    expect(createStepCountPolicy(0).steps).toBe(0);
    expect(createStepCountPolicy(7).steps).toBe(7);
    expect(() => createStepCountPolicy(-1)).toThrow(RangeError);
    expect(() => createStepCountPolicy(2.5)).toThrow(RangeError);
    expect(() => createStepCountPolicy(Number.NaN)).toThrow(RangeError);
  });
});
