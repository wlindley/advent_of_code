import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './solver';

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

interface Moon3D { px: number; py: number; pz: number; vx: number; vy: number; vz: number; }

function gravityDelta(a: number, b: number): number {
  return a < b ? 1 : a > b ? -1 : 0;
}

function stepFull3D(moons: readonly Moon3D[]): void {
  for (let i = 0; i < moons.length; i += 1) {
    const a = moons[i]!;
    for (let j = i + 1; j < moons.length; j += 1) {
      const b = moons[j]!;
      const dx = gravityDelta(a.px, b.px);
      const dy = gravityDelta(a.py, b.py);
      const dz = gravityDelta(a.pz, b.pz);
      a.vx += dx; b.vx -= dx;
      a.vy += dy; b.vy -= dy;
      a.vz += dz; b.vz -= dz;
    }
  }
  for (let i = 0; i < moons.length; i += 1) {
    const m = moons[i]!;
    m.px += m.vx; m.py += m.vy; m.pz += m.vz;
  }
}

function encodeState(moons: readonly Moon3D[]): string {
  const parts: string[] = [];
  for (let i = 0; i < moons.length; i += 1) {
    const m = moons[i]!;
    parts.push(`${m.px},${m.py},${m.pz},${m.vx},${m.vy},${m.vz}`);
  }
  return parts.join(';');
}

function findFirst3DRepeat(raw: string, maxSteps: number): { repeatStep: number; matchedStep: number } {
  const parsed = solver.parse(raw).moons;
  const moons: Moon3D[] = [];
  for (let i = 0; i < parsed.length; i += 1) {
    const p = parsed[i]!.position;
    moons.push({ px: p.x, py: p.y, pz: p.z, vx: 0, vy: 0, vz: 0 });
  }
  const seen = new Map<string, number>([[encodeState(moons), 0]]);
  for (let step = 1; step <= maxSteps; step += 1) {
    stepFull3D(moons);
    const key = encodeState(moons);
    const prev = seen.get(key);
    if (prev !== undefined) return { repeatStep: step, matchedStep: prev };
    seen.set(key, step);
  }
  throw new Error(`No repeat within ${maxSteps} steps`);
}

describe('2019 Day 12 Part 2 solver', () => {
  it('solves Official Examples 1 and 2 and formats answers', () => {
    const r1 = executeSolver(solver, EXAMPLE_1);
    expect(r1.answer).toBe(2772n);
    expect(solver.formatAnswer(r1.answer)).toBe('2772');

    const r2 = executeSolver(solver, EXAMPLE_2);
    expect(r2.answer).toBe(4686774924n);
    expect(solver.formatAnswer(r2.answer)).toBe('4686774924');
  });

  it('produces axis-cycle traces and validates trace maxSteps', () => {
    const s1 = solver.parse(EXAMPLE_1);
    const t1 = solver.trace(s1);
    expect(t1).toHaveLength(49);
    expect([t1[0]!.phase, t1[0]!.step]).toEqual(['preview', 0n]);
    expect(t1.slice(45, 48).map((f) => [f.phase, f.step])).toEqual([
      ['axis-locked', 18n], ['axis-locked', 28n], ['axis-locked', 44n],
    ]);
    expect([t1[48]!.phase, t1[48]!.step]).toEqual(['lcm-complete', 2772n]);

    expect(solver.trace(solver.parse(EXAMPLE_2))).toHaveLength(53);
    const t10 = solver.trace(s1, { maxSteps: 10 });
    expect(t10).toHaveLength(10);
    expect([t10[0]!.step, t10[9]!.step]).toEqual([0n, 2772n]);
    const t1Only = solver.trace(s1, { maxSteps: 1 });
    expect(t1Only).toHaveLength(1);
    expect(t1Only[0]!.phase).toBe('lcm-complete');

    expect(() => solver.trace(s1, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(s1, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => solver.trace(s1, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('handles identical positions, single moon, and malformed inputs', () => {
    expect(executeSolver(solver, '<x=1, y=2, z=3>\n<x=1, y=2, z=3>').answer).toBe(1n);
    expect(executeSolver(solver, '<x=5, y=-4, z=9>').answer).toBe(1n);
    expect(() => solver.parse('')).toThrow(SyntaxError);
    expect(() => solver.parse('<x=1, y=2>')).toThrow(SyntaxError);
    expect(() => solver.parse('<x=10000001, y=0, z=0>')).toThrow(RangeError);
  });

  it('matches an independent unfactored 3D state-set oracle', () => {
    expect(findFirst3DRepeat(EXAMPLE_1, 3000)).toEqual({ repeatStep: 2772, matchedStep: 0 });
    const fixtures = [
      '<x=-1, y=2, z=0>\n<x=3, y=-2, z=4>',
      '<x=0, y=-3, z=2>\n<x=4, y=1, z=-1>\n<x=-2, y=5, z=0>',
      '<x=1, y=0, z=-2>\n<x=-1, y=3, z=1>\n<x=2, y=-2, z=0>\n<x=0, y=1, z=3>',
    ];
    for (let i = 0; i < fixtures.length; i += 1) {
      const fixture = fixtures[i]!;
      const oracle = findFirst3DRepeat(fixture, 5000);
      expect(oracle.matchedStep).toBe(0);
      expect(executeSolver(solver, fixture).answer).toBe(BigInt(oracle.repeatStep));
    }
  });
});
