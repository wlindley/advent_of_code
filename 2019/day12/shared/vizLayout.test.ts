import { describe, expect, it } from 'vitest';
import { MoonState, MoonSystem, Vec3 } from './models';
import { buildOrbitStepTrace, type OrbitStepTraceFrame } from './trace';
import {
  computeAxisPhaseProgress,
  computeEnergyBarRatio,
  computeOrbitBounds,
  formatMoonLabel,
  projectIsometric,
  projectPlane,
} from './vizLayout';

describe('2019 Day 12 vizLayout', () => {
  it('computes orbit bounds across frames and rejects empty inputs', () => {
    const sys = MoonSystem.parse('<x=-2, y=3, z=-4>\n<x=6, y=-1, z=8>');
    const frames = buildOrbitStepTrace(sys, 3, 10);
    const bounds = computeOrbitBounds(frames);

    expect(Object.isFrozen(bounds)).toBe(true);
    expect(bounds.minX).toBeLessThanOrEqual(-2);
    expect(bounds.maxX).toBeGreaterThanOrEqual(6);
    expect(bounds.minY).toBeLessThanOrEqual(-1);
    expect(bounds.maxY).toBeGreaterThanOrEqual(3);
    expect(bounds.minZ).toBeLessThanOrEqual(-4);
    expect(bounds.maxZ).toBeGreaterThanOrEqual(8);

    expect(() => computeOrbitBounds([])).toThrow(RangeError);
    const emptyFrame: OrbitStepTraceFrame = {
      kind: 'orbit-step', step: 0, totalSteps: 0, moons: [], trails: [],
    };
    expect(() => computeOrbitBounds([emptyFrame])).toThrow(RangeError);
  });

  it('projects 3D points via isometric and plane projections and handles degenerate zero-span bounds', () => {
    const bounds = { minX: -10, maxX: 10, minY: -10, maxY: 10, minZ: -10, maxZ: 10 };
    const center = projectIsometric(Vec3.ZERO, bounds, 400, 300);
    expect(center.x).toBeCloseTo(200);
    expect(center.y).toBeCloseTo(150);

    const corner = projectIsometric(new Vec3(10, 10, -10), bounds, 400, 300);
    expect(corner.x).toBeGreaterThan(200);
    expect(corner.y).toBeLessThan(150);

    const xy = projectPlane(new Vec3(10, 10, -10), bounds, 'xy', 200, 200);
    const xz = projectPlane(new Vec3(10, 10, -10), bounds, 'xz', 200, 200);
    expect(xy.x).toBeGreaterThan(100);
    expect(xy.y).toBeLessThan(100);
    expect(xz.y).toBeGreaterThan(100);

    // Zero-span bounds map cleanly to center
    const single = new MoonSystem([new MoonState(new Vec3(5, 5, 5), Vec3.ZERO)]);
    const degBounds = computeOrbitBounds(buildOrbitStepTrace(single, 0, 5));
    expect(projectIsometric(new Vec3(5, 5, 5), degBounds, 300, 200)).toEqual({ x: 150, y: 100 });
    expect(projectPlane(new Vec3(5, 5, 5), degBounds, 'xy', 300, 200)).toEqual({ x: 150, y: 100 });

    expect(() => projectIsometric(Vec3.ZERO, bounds, 0, 100)).toThrow(RangeError);
    expect(() => projectIsometric(Vec3.ZERO, bounds, 100, -1)).toThrow(RangeError);
    expect(() => projectPlane(Vec3.ZERO, bounds, 'xy', Number.NaN, 100)).toThrow(RangeError);
    expect(() => projectPlane(Vec3.ZERO, bounds, 'xz', 100, 0)).toThrow(RangeError);
  });

  it('computes energy bar ratios and validates inputs', () => {
    expect(computeEnergyBarRatio(0, 0)).toBe(0);
    expect(computeEnergyBarRatio(25, 100)).toBe(0.25);
    expect(computeEnergyBarRatio(150, 100)).toBe(1);
    expect(() => computeEnergyBarRatio(-1, 10)).toThrow(RangeError);
    expect(() => computeEnergyBarRatio(1, -10)).toThrow(RangeError);
    expect(() => computeEnergyBarRatio(Number.POSITIVE_INFINITY, 10)).toThrow(RangeError);
  });

  it('computes BigInt axis phase progress safely and rejects non-positive periods', () => {
    expect(computeAxisPhaseProgress(-5n, 100n)).toBe(0);
    expect(computeAxisPhaseProgress(0n, 100n)).toBe(0);
    expect(computeAxisPhaseProgress(50n, 100n)).toBe(0.5);
    expect(computeAxisPhaseProgress(100n, 100n)).toBe(1);
    expect(computeAxisPhaseProgress(500n, 100n)).toBe(1);
    expect(computeAxisPhaseProgress(2_000_000_000_000n, 4_000_000_000_000n)).toBe(0.5);
    expect(() => computeAxisPhaseProgress(1n, 0n)).toThrow(RangeError);
    expect(() => computeAxisPhaseProgress(1n, -2n)).toThrow(RangeError);
  });

  it('formats canonical moon labels and generic labels for >= 4 moons', () => {
    expect(formatMoonLabel(0)).toBe('Io');
    expect(formatMoonLabel(1)).toBe('Europa');
    expect(formatMoonLabel(2)).toBe('Ganymede');
    expect(formatMoonLabel(3)).toBe('Callisto');
    expect(formatMoonLabel(4)).toBe('Moon 5');
    expect(() => formatMoonLabel(-1)).toThrow(RangeError);
    expect(() => formatMoonLabel(1.2)).toThrow(RangeError);
  });
});
