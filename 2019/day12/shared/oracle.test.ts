import { describe, expect, it } from 'vitest';
import { lcmBigInt } from '../../../shared/core';
import { analyzeSystemCycles, MoonSystem, simulateSteps } from './index';

interface NaiveMoon {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
}

function toNaive(system: MoonSystem): NaiveMoon[] {
  return system.moons.map((m) => ({
    x: m.position.x, y: m.position.y, z: m.position.z,
    vx: m.velocity.x, vy: m.velocity.y, vz: m.velocity.z,
  }));
}

function naiveStep3D(moons: NaiveMoon[]): void {
  for (let i = 0; i < moons.length; i += 1) {
    for (let j = 0; j < moons.length; j += 1) {
      if (i === j) continue;
      const a = moons[i]!;
      const b = moons[j]!;
      a.vx += Math.sign(b.x - a.x);
      a.vy += Math.sign(b.y - a.y);
      a.vz += Math.sign(b.z - a.z);
    }
  }
  for (const m of moons) {
    m.x += m.vx;
    m.y += m.vy;
    m.z += m.vz;
  }
}

function naiveTotalEnergy(moons: readonly NaiveMoon[]): number {
  let sum = 0;
  for (const m of moons) {
    sum += (Math.abs(m.x) + Math.abs(m.y) + Math.abs(m.z))
      * (Math.abs(m.vx) + Math.abs(m.vy) + Math.abs(m.vz));
  }
  return sum;
}

function serialize3D(moons: readonly NaiveMoon[]): string {
  return moons.map((m) => `${m.x},${m.y},${m.z},${m.vx},${m.vy},${m.vz}`).join('|');
}

function naiveFull3DRepeatOracle(system: MoonSystem, cap: number): bigint {
  const moons = toNaive(system);
  const seen = new Set<string>([serialize3D(moons)]);
  for (let step = 1; step <= cap; step += 1) {
    naiveStep3D(moons);
    const key = serialize3D(moons);
    if (seen.has(key)) return BigInt(step);
    seen.add(key);
  }
  throw new Error(`Exceeded cap ${cap}`);
}

function naive1DAxisPeriod(coords: readonly number[], cap: number): bigint {
  const n = coords.length;
  const pos = [...coords];
  const vel = new Array<number>(n).fill(0);
  const initKey = `${pos.join(',')}|${vel.join(',')}`;
  for (let step = 1; step <= cap; step += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        if (i !== j) vel[i] = vel[i]! + Math.sign(pos[j]! - pos[i]!);
      }
    }
    for (let i = 0; i < n; i += 1) pos[i] = pos[i]! + vel[i]!;
    if (`${pos.join(',')}|${vel.join(',')}` === initKey) return BigInt(step);
  }
  throw new Error(`Axis exceeded cap ${cap}`);
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

function makeSeededSystem(rng: () => number, moonCount: number, maxCoord: number): MoonSystem {
  const lines: string[] = [];
  for (let i = 0; i < moonCount; i += 1) {
    const x = Math.floor(rng() * (2 * maxCoord + 1)) - maxCoord;
    const y = Math.floor(rng() * (2 * maxCoord + 1)) - maxCoord;
    const z = Math.floor(rng() * (2 * maxCoord + 1)) - maxCoord;
    lines.push(`<x=${x}, y=${y}, z=${z}>`);
  }
  return MoonSystem.parse(lines.join('\n'));
}

const EXAMPLE_1 = '<x=-1, y=0, z=2>\n<x=2, y=-10, z=-7>\n<x=4, y=-8, z=8>\n<x=3, y=5, z=-1>';
const EXAMPLE_2 = '<x=-8, y=-10, z=0>\n<x=5, y=5, z=10>\n<x=2, y=-7, z=3>\n<x=9, y=-8, z=-3>';

describe('2019 Day 12 independent oracle verification', () => {
  it('cross-verifies simulateSteps against independent naive 3D simulator on examples, edge cases, and 30 fuzz cases', () => {
    const ex1 = MoonSystem.parse(EXAMPLE_1);
    const ex1At10 = toNaive(ex1);
    for (let s = 0; s < 10; s += 1) naiveStep3D(ex1At10);
    expect(simulateSteps(ex1, 10).totalEnergy).toBe(179);
    expect(naiveTotalEnergy(ex1At10)).toBe(179);

    const ex1At1000 = toNaive(ex1);
    for (let s = 0; s < 1000; s += 1) naiveStep3D(ex1At1000);
    const prod1000 = simulateSteps(ex1, 1000);
    expect(prod1000.totalEnergy).toBe(naiveTotalEnergy(ex1At1000));
    expect(prod1000.totalEnergy).toBe(183);

    // Modular invariant for Example 1: periods (18, 28, 44) => 1000 mod (18, 28, 44) = (10, 20, 32)
    const sx = simulateSteps(ex1, 10);
    const sy = simulateSteps(ex1, 20);
    const sz = simulateSteps(ex1, 32);
    for (let i = 0; i < 4; i += 1) {
      expect(prod1000.moons[i]!.position.x).toBe(sx.moons[i]!.position.x);
      expect(prod1000.moons[i]!.velocity.x).toBe(sx.moons[i]!.velocity.x);
      expect(prod1000.moons[i]!.position.y).toBe(sy.moons[i]!.position.y);
      expect(prod1000.moons[i]!.velocity.y).toBe(sy.moons[i]!.velocity.y);
      expect(prod1000.moons[i]!.position.z).toBe(sz.moons[i]!.position.z);
      expect(prod1000.moons[i]!.velocity.z).toBe(sz.moons[i]!.velocity.z);
    }

    const ex2 = MoonSystem.parse(EXAMPLE_2);
    const ex2At100 = toNaive(ex2);
    for (let s = 0; s < 100; s += 1) naiveStep3D(ex2At100);
    expect(simulateSteps(ex2, 100).totalEnergy).toBe(1940);
    expect(naiveTotalEnergy(ex2At100)).toBe(1940);

    // Edge cases: 1-moon and duplicate coordinates
    for (const raw of ['<x=7, y=-3, z=12>', '<x=4, y=-2, z=9>\n<x=4, y=-2, z=9>\n<x=4, y=-2, z=9>']) {
      const sys = MoonSystem.parse(raw);
      const naive = toNaive(sys);
      for (let s = 0; s < 25; s += 1) naiveStep3D(naive);
      expect(simulateSteps(sys, 25).totalEnergy).toBe(naiveTotalEnergy(naive));
    }

    // 30 seeded PRNG fuzz cases
    const rng = makeRng(20191201);
    for (let c = 0; c < 30; c += 1) {
      const count = 2 + Math.floor(rng() * 5);
      const steps = Math.floor(rng() * 80);
      const sys = makeSeededSystem(rng, count, 20);
      const prod = simulateSteps(sys, steps);
      const naive = toNaive(sys);
      for (let s = 0; s < steps; s += 1) naiveStep3D(naive);
      expect(prod.totalEnergy).toBe(naiveTotalEnergy(naive));
      for (let i = 0; i < count; i += 1) {
        expect(prod.moons[i]!.position.x).toBe(naive[i]!.x);
        expect(prod.moons[i]!.position.y).toBe(naive[i]!.y);
        expect(prod.moons[i]!.position.z).toBe(naive[i]!.z);
      }
    }
  });

  it('cross-verifies cycle periods via full-3D Set oracle on Example 1, edge cases, and 10 small-period seeded cases', () => {
    const ex1 = MoonSystem.parse(EXAMPLE_1);
    expect(analyzeSystemCycles(ex1, 10_000).globalPeriod).toBe(2772n);
    expect(naiveFull3DRepeatOracle(ex1, 10_000)).toBe(2772n);

    const oneMoon = MoonSystem.parse('<x=5, y=-9, z=2>');
    expect(analyzeSystemCycles(oneMoon, 100).globalPeriod).toBe(1n);
    expect(naiveFull3DRepeatOracle(oneMoon, 100)).toBe(1n);

    const dupMoons = MoonSystem.parse('<x=3, y=3, z=3>\n<x=3, y=3, z=3>');
    expect(analyzeSystemCycles(dupMoons, 100).globalPeriod).toBe(1n);
    expect(naiveFull3DRepeatOracle(dupMoons, 100)).toBe(1n);

    const rng = makeRng(20191202);
    let verified = 0;
    while (verified < 10) {
      const sys = makeSeededSystem(rng, 2 + (verified % 2), 4);
      const analysis = analyzeSystemCycles(sys, 10_000);
      if (analysis.globalPeriod <= 10_000n) {
        expect(naiveFull3DRepeatOracle(sys, 10_000)).toBe(analysis.globalPeriod);
        verified += 1;
      }
    }
  });

  it('cross-verifies Example 2 axis periods via independent naive 1D repeat oracle', () => {
    const ex2 = MoonSystem.parse(EXAMPLE_2);
    const px = naive1DAxisPeriod(ex2.moons.map((m) => m.position.x), 10_000);
    const py = naive1DAxisPeriod(ex2.moons.map((m) => m.position.y), 10_000);
    const pz = naive1DAxisPeriod(ex2.moons.map((m) => m.position.z), 10_000);
    expect(px).toBe(2028n);
    expect(py).toBe(5898n);
    expect(pz).toBe(4702n);
    expect(lcmBigInt(lcmBigInt(px, py), pz)).toBe(4686774924n);
    expect(analyzeSystemCycles(ex2, 10_000).globalPeriod).toBe(4686774924n);
  });
});
