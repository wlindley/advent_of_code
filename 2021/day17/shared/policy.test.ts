import { describe, expect, it } from 'vitest';
import { analyzeTargetArea } from './analyzer';
import { TargetArea } from './target';
import { MAX_APEX_POLICY, TrickShotPolicy, VALID_VELOCITY_COUNT_POLICY } from './policy';

describe('2021 Day 17 TrickShotPolicy', () => {
  it('computes Part 1 max apex and Part 2 valid velocity count cleanly', () => {
    const analysis = analyzeTargetArea(new TargetArea(20, 30, -10, -5));
    expect(Object.isFrozen(MAX_APEX_POLICY)).toBe(true);
    expect(Object.isFrozen(VALID_VELOCITY_COUNT_POLICY)).toBe(true);
    expect(MAX_APEX_POLICY.mode).toBe('max-apex');
    expect(VALID_VELOCITY_COUNT_POLICY.mode).toBe('valid-count');
    expect(MAX_APEX_POLICY.label).toBe('Max Apex Y');
    expect(VALID_VELOCITY_COUNT_POLICY.label).toBe('Valid Velocities');
    expect(MAX_APEX_POLICY.compute(analysis)).toBe(45);
    expect(VALID_VELOCITY_COUNT_POLICY.compute(analysis)).toBe(112);
  });

  it('supports custom immutable TrickShotPolicy strategies', () => {
    const custom = new TrickShotPolicy({
      mode: 'max-apex',
      label: 'Target Width',
      compute: (analysis) => analysis.target.width,
    });
    expect(Object.isFrozen(custom)).toBe(true);
    const analysis = analyzeTargetArea(new TargetArea(20, 30, -10, -5));
    expect(custom.compute(analysis)).toBe(11);
  });
});
