import { describe, expect, it } from 'vitest';
import {
  AXES,
  MAX_ABS_COORDINATE,
  MAX_MOONS,
  MoonState,
  MoonSystem,
  Vec3,
} from './models';

describe('2019 Day 12 shared models', () => {
  it('exposes frozen AXES tuple and expected constants', () => {
    expect(AXES).toEqual(['x', 'y', 'z']);
    expect(Object.isFrozen(AXES)).toBe(true);
    expect(MAX_ABS_COORDINATE).toBe(10_000_000);
    expect(MAX_MOONS).toBe(64);
  });

  describe('Vec3', () => {
    it('constructs frozen immutable vectors, exposes ZERO, manhattanNorm, at, and equals', () => {
      const v = new Vec3(-3, 4, -5);
      expect(Object.isFrozen(v)).toBe(true);
      expect(v.x).toBe(-3);
      expect(v.y).toBe(4);
      expect(v.z).toBe(-5);
      expect(v.manhattanNorm).toBe(12);
      expect(v.at('x')).toBe(-3);
      expect(v.at('y')).toBe(4);
      expect(v.at('z')).toBe(-5);

      expect(Vec3.ZERO.equals(new Vec3(0, 0, 0))).toBe(true);
      expect(v.equals(new Vec3(-3, 4, -5))).toBe(true);
      expect(v.equals(new Vec3(-3, 4, 5))).toBe(false);
      expect(v.equals(new Vec3(-3, 0, -5))).toBe(false);
      expect(v.equals(new Vec3(0, 4, -5))).toBe(false);
    });

    it('allows simulated coordinates exceeding MAX_ABS_COORDINATE while rejecting non-safe integers', () => {
      const large = new Vec3(20_000_000, -50_000_000, 0);
      expect(large.x).toBe(20_000_000);
      expect(() => new Vec3(1.5, 0, 0)).toThrow(RangeError);
      expect(() => new Vec3(0, Number.NaN, 0)).toThrow(RangeError);
      expect(() => new Vec3(0, 0, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    });
  });

  describe('MoonState', () => {
    it('computes potential, kinetic, and total energy dynamically and checks equality', () => {
      const moon = new MoonState(new Vec3(2, -1, 3), new Vec3(-3, 2, 1));
      expect(Object.isFrozen(moon)).toBe(true);
      expect(moon.potentialEnergy).toBe(6);
      expect(moon.kineticEnergy).toBe(6);
      expect(moon.totalEnergy).toBe(36);
      expect(moon.equals(new MoonState(new Vec3(2, -1, 3), new Vec3(-3, 2, 1)))).toBe(true);
      expect(moon.equals(new MoonState(new Vec3(2, -1, 4), new Vec3(-3, 2, 1)))).toBe(false);
      expect(moon.equals(new MoonState(new Vec3(2, -1, 3), new Vec3(-3, 2, 0)))).toBe(false);
    });
  });

  describe('MoonSystem', () => {
    it('parses valid input, trims outer blank lines and CRLF, and computes energies and axis arrays', () => {
      const raw = '\r\n<x=-1, y=0, z=2>\r\n<x=2, y=-10, z=-7>\n<x=4, y=-8, z=8>\n<x=3, y=5, z=-1>\r\n\r\n';
      const system = MoonSystem.parse(raw);

      expect(Object.isFrozen(system)).toBe(true);
      expect(Object.isFrozen(system.moons)).toBe(true);
      expect(system.moonCount).toBe(4);
      expect(system.totalEnergy).toBe(0);

      const px = system.axisInitialPositions('x');
      const vx = system.axisInitialVelocities('x');
      expect(px).toBeInstanceOf(Int32Array);
      expect(vx).toBeInstanceOf(Int32Array);
      expect(Array.from(px)).toEqual([-1, 2, 4, 3]);
      expect(Array.from(vx)).toEqual([0, 0, 0, 0]);
      // Mutable Int32Array must never be frozen
      px[0] = 99;
      expect(px[0]).toBe(99);
      expect(system.moons[0]!.position.x).toBe(-1);
    });

    it('computes non-zero MoonSystem totalEnergy for moving moons', () => {
      const system = new MoonSystem([
        new MoonState(new Vec3(2, 1, -3), new Vec3(-3, -2, 1)),
        new MoonState(new Vec3(1, -8, 0), new Vec3(-1, 1, 3)),
      ]);
      expect(system.totalEnergy).toBe(6 * 6 + 9 * 5);
    });

    it('rejects invalid MoonSystem construction counts', () => {
      expect(() => new MoonSystem([])).toThrow(RangeError);
      const tooMany = Array.from({ length: MAX_MOONS + 1 }, () => new MoonState(Vec3.ZERO, Vec3.ZERO));
      expect(() => new MoonSystem(tooMany)).toThrow(RangeError);
    });

    it('rejects empty input, interior blank lines, malformed lines, wrong axis order, out-of-range coords, and > MAX_MOONS', () => {
      expect(() => MoonSystem.parse('')).toThrow(SyntaxError);
      expect(() => MoonSystem.parse('   \r\n  ')).toThrow(SyntaxError);
      expect(() => MoonSystem.parse('<x=1, y=2, z=3>\n\n<x=4, y=5, z=6>')).toThrow(SyntaxError);
      expect(() => MoonSystem.parse('<x=1, y=2>')).toThrow(SyntaxError);
      expect(() => MoonSystem.parse('<y=1, x=2, z=3>')).toThrow(SyntaxError);
      expect(() => MoonSystem.parse(`<x=${MAX_ABS_COORDINATE + 1}, y=0, z=0>`)).toThrow(RangeError);
      expect(() => MoonSystem.parse(`<x=0, y=${-MAX_ABS_COORDINATE - 1}, z=0>`)).toThrow(RangeError);
      expect(() => MoonSystem.parse('<x=9007199254740992, y=0, z=0>')).toThrow(RangeError);

      const overLimit = Array.from({ length: MAX_MOONS + 1 }, () => '<x=0, y=0, z=0>').join('\n');
      expect(() => MoonSystem.parse(overLimit)).toThrow(RangeError);
    });
  });
});
