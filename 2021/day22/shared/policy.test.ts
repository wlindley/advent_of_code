import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../shared/core';
import { Cuboid } from './cuboid';
import {
  BoundedReactorPolicy,
  FULL_REACTOR_POLICY,
  FullReactorPolicy,
  INITIALIZATION_POLICY,
  INITIALIZATION_REGION,
} from './policy';

function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Cuboid {
  return new Cuboid(
    new ClosedInterval(BigInt(x0), BigInt(x1)),
    new ClosedInterval(BigInt(y0), BigInt(y1)),
    new ClosedInterval(BigInt(z0), BigInt(z1)),
  );
}

describe('ReactorPolicy', () => {
  it('defines the [-50..50]^3 initialization region', () => {
    expect(INITIALIZATION_REGION.x.start).toBe(-50n);
    expect(INITIALIZATION_REGION.x.end).toBe(50n);
    expect(INITIALIZATION_REGION.volume).toBe(101n * 101n * 101n);
    expect(INITIALIZATION_POLICY.mode).toBe('initialization');
    expect(Object.isFrozen(INITIALIZATION_POLICY)).toBe(true);
  });

  it('clips cuboids inside, straddling, and outside bounded regions', () => {
    const inside = box(-10, 10, 0, 20, -5, 5);
    expect(INITIALIZATION_POLICY.clip(inside)?.volume).toBe(inside.volume);

    const straddling = box(-60, -40, 45, 55, -1, 1);
    const clipped = INITIALIZATION_POLICY.clip(straddling);
    expect(clipped).not.toBeNull();
    expect(clipped!.x.start).toBe(-50n);
    expect(clipped!.x.end).toBe(-40n);
    expect(clipped!.y.start).toBe(45n);
    expect(clipped!.y.end).toBe(50n);
    expect(clipped!.volume).toBe(11n * 6n * 3n);

    expect(INITIALIZATION_POLICY.clip(box(51, 100, 0, 10, 0, 10))).toBeNull();

    const custom = new BoundedReactorPolicy(box(0, 5, 0, 5, 0, 5));
    expect(custom.bounds.volume).toBe(216n);
    expect(custom.clip(box(-2, 2, 0, 5, 0, 5))?.volume).toBe(3n * 6n * 6n);
  });

  it('passes cuboids through unmodified in FullReactorPolicy', () => {
    expect(FULL_REACTOR_POLICY).toBeInstanceOf(FullReactorPolicy);
    expect(FULL_REACTOR_POLICY.mode).toBe('full');
    expect(Object.isFrozen(FULL_REACTOR_POLICY)).toBe(true);

    const huge = box(-100_000, 100_000, -100_000, 100_000, -100_000, 100_000);
    expect(FULL_REACTOR_POLICY.clip(huge)).toBe(huge);
  });
});
