import { describe, expect, it } from 'vitest';
import { AXES, MoonState, MoonSystem, Vec3 } from './models';
import {
  buildAxisCycleTrace,
  buildOrbitStepTrace,
  DEFAULT_MAX_TRACE_FRAMES,
  MAX_CYCLE_PREVIEW_STEPS,
  MAX_TRAIL_LENGTH,
} from './trace';

const EXAMPLE_1 = [
  '<x=-1, y=0, z=2>',
  '<x=2, y=-10, z=-7>',
  '<x=4, y=-8, z=8>',
  '<x=3, y=5, z=-1>',
].join('\n');

describe('2019 Day 12 shared trace', () => {
  it('exposes trace bounding constants', () => {
    expect(DEFAULT_MAX_TRACE_FRAMES).toBe(240);
    expect(MAX_TRAIL_LENGTH).toBe(24);
    expect(MAX_CYCLE_PREVIEW_STEPS).toBe(48);
  });

  it('builds orbit-step trace preserving endpoints and bounding frame and trail lengths', () => {
    const system = MoonSystem.parse(EXAMPLE_1);
    const frames = buildOrbitStepTrace(system, 1000, 30);

    expect(frames.length).toBe(30);
    expect(frames[0]!.kind).toBe('orbit-step');
    expect(frames[0]!.step).toBe(0);
    expect(frames[0]!.totalSteps).toBe(1000);
    expect(frames[0]!.trails[0]!.length).toBe(1);

    const last = frames[frames.length - 1]!;
    expect(last.step).toBe(1000);
    expect(last.trails[0]!.length).toBe(MAX_TRAIL_LENGTH);
    expect(Object.isFrozen(last)).toBe(true);
    expect(Object.isFrozen(last.moons)).toBe(true);
    expect(Object.isFrozen(last.trails)).toBe(true);
  });

  it('handles maxSteps=1 and totalSteps=0 in buildOrbitStepTrace', () => {
    const system = MoonSystem.parse(EXAMPLE_1);
    const single = buildOrbitStepTrace(system, 10, 1);
    expect(single.length).toBe(1);
    expect(single[0]!.step).toBe(10);

    const zeroSteps = buildOrbitStepTrace(system, 0, 10);
    expect(zeroSteps.length).toBe(1);
    expect(zeroSteps[0]!.step).toBe(0);
    expect(zeroSteps[0]!.moons[0]!.equals(system.moons[0]!)).toBe(true);
  });

  it('rejects invalid totalSteps or maxSteps in buildOrbitStepTrace', () => {
    const system = MoonSystem.parse(EXAMPLE_1);
    expect(() => buildOrbitStepTrace(system, -1, 10)).toThrow(RangeError);
    expect(() => buildOrbitStepTrace(system, 1.5, 10)).toThrow(RangeError);
    expect(() => buildOrbitStepTrace(system, 10, 0)).toThrow(RangeError);
  });

  it('builds canonical axis-cycle trace with preview, 3 sorted axis-locked, and lcm-complete frames', () => {
    const system = MoonSystem.parse(EXAMPLE_1);
    // Ex1 maxAxisPeriod is 44 < 48, so previewSteps = 44 (45 preview + 3 locked + 1 lcm = 49 frames)
    const full = buildAxisCycleTrace(system, 10_000, 240);
    expect(full.length).toBe(49);
    expect(full[0]!.kind).toBe('axis-cycle');
    expect(full[0]!.phase).toBe('preview');
    expect(full[0]!.step).toBe(0n);
    expect(full[0]!.lockedAxes).toEqual([]);

    const lock1 = full[45]!;
    expect(lock1.phase).toBe('axis-locked');
    expect(lock1.step).toBe(18n);
    expect(lock1.lockedAxes).toEqual(['x']);

    const lock2 = full[46]!;
    expect(lock2.phase).toBe('axis-locked');
    expect(lock2.step).toBe(28n);
    expect(lock2.lockedAxes).toEqual(['x', 'y']);

    const lock3 = full[47]!;
    expect(lock3.phase).toBe('axis-locked');
    expect(lock3.step).toBe(44n);
    expect(lock3.lockedAxes).toEqual(['x', 'y', 'z']);

    const complete = full[48]!;
    expect(complete.phase).toBe('lcm-complete');
    expect(complete.step).toBe(2772n);
    expect(complete.lockedAxes).toEqual(AXES);
    expect(complete.moons[0]!.equals(system.moons[0]!)).toBe(true);

    // Downsampled axis-cycle trace preserves endpoints
    const sampled = buildAxisCycleTrace(system, 10_000, 10);
    expect(sampled.length).toBe(10);
    expect(sampled[0]!.phase).toBe('preview');
    expect(sampled[9]!.phase).toBe('lcm-complete');
  });

  it('clamps previewSteps to MAX_CYCLE_PREVIEW_STEPS when maxAxisPeriod exceeds 48', () => {
    const largePeriod = MoonSystem.parse([
      '<x=-8, y=-10, z=0>',
      '<x=5, y=5, z=10>',
      '<x=2, y=-7, z=3>',
      '<x=9, y=-8, z=-3>',
    ].join('\n'));
    const frames = buildAxisCycleTrace(largePeriod, 20_000, 240);
    // 49 preview (0..48) + 3 locked + 1 complete = 53
    expect(frames.length).toBe(53);
    expect(frames[48]!.phase).toBe('preview');
    expect(frames[48]!.step).toBe(48n);
    expect(frames[49]!.phase).toBe('axis-locked');
  });

  it('validates maxSteps in buildAxisCycleTrace and handles period-1 systems', () => {
    const trivial = new MoonSystem([
      new MoonState(Vec3.ZERO, Vec3.ZERO),
      new MoonState(Vec3.ZERO, Vec3.ZERO),
    ]);
    const frames = buildAxisCycleTrace(trivial, 10, 20);
    // 2 preview (0..1) + 3 locked + 1 complete = 6
    expect(frames.length).toBe(6);
    expect(() => buildAxisCycleTrace(trivial, 10, 0)).toThrow(RangeError);
  });
});
