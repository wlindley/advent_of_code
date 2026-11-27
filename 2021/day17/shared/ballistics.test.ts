import { describe, expect, it } from 'vitest';
import { TargetArea } from './target';
import {
  computeApexY,
  computeXStepInterval,
  computeXStepIntervals,
  computeYStepInterval,
  computeYStepIntervals,
  LaunchVelocity,
  ProbePoint,
  simulateTrajectory,
  XStepInterval,
  YStepInterval,
} from './ballistics';

describe('2021 Day 17 Ballistics', () => {
  const example = new TargetArea(20, 30, -10, -5);

  it('computes apexY and validates LaunchVelocity and ProbePoint', () => {
    expect(computeApexY(9)).toBe(45);
    expect(computeApexY(0)).toBe(0);
    expect(computeApexY(-5)).toBe(0);

    const vel = new LaunchVelocity(6, 9);
    expect(Object.isFrozen(vel)).toBe(true);
    expect(vel.apexY).toBe(45);

    const pt = new ProbePoint(1, 6, 9, 5, 8, false);
    expect(Object.isFrozen(pt)).toBe(true);
    expect(pt.inTarget).toBe(false);

    expect(() => new LaunchVelocity(-1, 0)).toThrow(RangeError);
    expect(() => new LaunchVelocity(1.5, 0)).toThrow(RangeError);
    expect(() => new LaunchVelocity(1, 1.5)).toThrow(RangeError);
  });

  it('checks step window overlaps symmetrically across X and Y intervals', () => {
    const xInt = new XStepInterval(7, 4, 7, false);
    const yHit = new YStepInterval(2, 7, 7);
    const yBefore = new YStepInterval(-5, 1, 2);
    const yAfter = new YStepInterval(4, 10, 11);

    expect(Object.isFrozen(xInt)).toBe(true);
    expect(Object.isFrozen(yHit)).toBe(true);
    expect(yHit.apexY).toBe(3);

    expect(xInt.overlaps(yHit)).toBe(true);
    expect(yHit.overlaps(xInt)).toBe(true);
    expect(xInt.overlaps(yBefore)).toBe(false);
    expect(xInt.overlaps(yAfter)).toBe(false);
  });

  it('handles stalling, non-stalling, overshoot-at-stall, and maxStep-capped X intervals', () => {
    const stalled = computeXStepInterval(6, example);
    expect(stalled).not.toBeNull();
    expect(stalled!.firstStep).toBe(5);
    expect(stalled!.lastStep).toBe(example.maxStep);
    expect(stalled!.stallsInTarget).toBe(true);

    const passing = computeXStepInterval(8, example);
    expect(passing).not.toBeNull();
    expect(passing!.firstStep).toBe(3);
    expect(passing!.lastStep).toBe(5);
    expect(passing!.stallsInTarget).toBe(false);

    expect(computeXStepInterval(5, example)).toBeNull();
    expect(computeXStepInterval(15, new TargetArea(20, 21, -10, -5))).toBeNull();
    expect(computeXStepInterval(10, new TargetArea(20, 30, -1, -1))).toBeNull();

    const overshootAtStall = computeXStepInterval(7, new TargetArea(20, 27, -6, -3));
    expect(overshootAtStall).not.toBeNull();
    expect(overshootAtStall!.firstStep).toBe(4);
    expect(overshootAtStall!.lastStep).toBe(6);
    expect(overshootAtStall!.stallsInTarget).toBe(false);
  });

  it('computes Y step intervals for positive, zero, negative, and skipping vy', () => {
    const best = computeYStepInterval(9, example);
    expect(best).not.toBeNull();
    expect(best!.firstStep).toBe(20);
    expect(best!.lastStep).toBe(20);
    expect(best!.apexY).toBe(45);

    expect(computeYStepInterval(10, example)).toBeNull();

    const zeroVy = computeYStepInterval(0, example);
    expect(zeroVy).not.toBeNull();
    expect(zeroVy!.firstStep).toBe(4);
    expect(zeroVy!.lastStep).toBe(5);

    const direct = computeYStepInterval(-10, example);
    expect(direct).not.toBeNull();
    expect(direct!.firstStep).toBe(1);
    expect(direct!.lastStep).toBe(1);

    expect(computeYStepInterval(-4, new TargetArea(1, 5, -6, -6))).toBeNull();
  });

  it('collects frozen X and Y intervals and simulates full trajectories', () => {
    const xInts = computeXStepIntervals(example);
    const yInts = computeYStepIntervals(example);
    expect(Object.isFrozen(xInts)).toBe(true);
    expect(Object.isFrozen(yInts)).toBe(true);
    expect(xInts.length).toBeGreaterThan(0);
    expect(yInts.length).toBeGreaterThan(0);

    const arc = simulateTrajectory(new LaunchVelocity(6, 9), example);
    expect(Object.isFrozen(arc)).toBe(true);
    expect(arc.some((p) => p.y === 45)).toBe(true);
    expect(arc.some((p) => p.inTarget && p.x === 21 && p.y === -10)).toBe(true);

    const fastX = simulateTrajectory(new LaunchVelocity(35, 0), example);
    expect(fastX[fastX.length - 1]!.x).toBeGreaterThan(example.xMax);
    expect(fastX.some((p) => p.inTarget)).toBe(false);
  });
});
