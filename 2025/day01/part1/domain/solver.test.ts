import { describe, expect, it } from 'vitest';
import { Rotation } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver } from './index';

const EXAMPLE_INPUT = `L68
L30
R48
L5
R60
L55
L1
L99
R14
L82`;

describe('2025 day 01 part 1 solver', () => {
  it('solves the official example input to 3', () => {
    const rotations = solver.parse(EXAMPLE_INPUT);
    expect(rotations).toHaveLength(10);
    expect(solver.solve(rotations)).toBe(3);
  });

  it('handles single-rotation zero hits, multi-turn non-hits, consecutive hits, and empty list', () => {
    expect(solver.solve([new Rotation('L', 50)])).toBe(1);
    expect(solver.solve([new Rotation('R', 50)])).toBe(1);
    expect(solver.solve([new Rotation('R', 100)])).toBe(0);
    expect(solver.solve([new Rotation('R', 50), new Rotation('L', 100), new Rotation('R', 200)])).toBe(3);
    expect(solver.solve([])).toBe(0);
  });

  it('produces full trace frames with accurate telemetry', () => {
    const rotations = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(rotations);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(250);
    expect(frames).toHaveLength(11);
    expect(frames[0]).toEqual({
      step: 0,
      rotation: null,
      fromPosition: 50,
      toPosition: 50,
      zeroCount: 0,
    });
    expect(frames[3]).toEqual({
      step: 3,
      rotation: rotations[2],
      fromPosition: 52,
      toPosition: 0,
      zeroCount: 1,
    });
    expect(frames[10]?.zeroCount).toBe(3);
    expect(frames[10]?.toPosition).toBe(32);
  });

  it('samples large traces and preserves initial and final frames', () => {
    const rotations = Array.from({ length: 500 }, () => new Rotation('R', 1));
    const sampled = solver.trace!(rotations, { maxSteps: 50 });
    expect(sampled.length).toBeLessThanOrEqual(50);
    expect(sampled[0]?.step).toBe(0);
    expect(sampled[sampled.length - 1]?.step).toBe(500);
    expect(sampled[sampled.length - 1]?.zeroCount).toBe(5);
  });

  it('avoids duplicating final frame on exact-divisor sampling and handles maxSteps = 1', () => {
    const nine = Array.from({ length: 9 }, () => new Rotation('R', 10));
    const exact = solver.trace!(nine, { maxSteps: 4 });
    expect(exact.map((f) => f.step)).toEqual([0, 3, 6, 9]);

    const single = solver.trace!(nine, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.step).toBe(9);
    expect(single[0]?.toPosition).toBe(40);
  });

  it('rejects invalid maxSteps values', () => {
    const rotations = [new Rotation('R', 1)];
    expect(() => solver.trace!(rotations, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace!(rotations, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => solver.trace!(rotations, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
