import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../shared/core';
import { Cuboid } from './cuboid';
import { parseRebootSteps, type RebootAction, type RebootStep } from './parser';
import { FULL_REACTOR_POLICY, INITIALIZATION_POLICY } from './policy';
import { applyEffectiveStep, applyRebootStep, executeReboot, totalOnVolume } from './reactor';

function createPrng(initialSeed: number): () => number {
  let state = initialSeed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function randRange(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function makeRandomCuboid(rng: () => number, minCoord: bigint, span: number, maxSize: number): Cuboid {
  const x0 = minCoord + BigInt(randRange(rng, 0, span));
  const y0 = minCoord + BigInt(randRange(rng, 0, span));
  const z0 = minCoord + BigInt(randRange(rng, 0, span));
  return new Cuboid(
    new ClosedInterval(x0, x0 + BigInt(randRange(rng, 0, maxSize))),
    new ClosedInterval(y0, y0 + BigInt(randRange(rng, 0, maxSize))),
    new ClosedInterval(z0, z0 + BigInt(randRange(rng, 0, maxSize))),
  );
}

function generateSteps(seed: number, count: number, minCoord: bigint, span: number, maxSize: number): RebootStep[] {
  const rng = createPrng(seed);
  const steps: RebootStep[] = [];
  for (let i = 0; i < count; i += 1) {
    const action: RebootAction = rng() < 0.65 ? 'on' : 'off';
    steps.push({ action, cuboid: makeRandomCuboid(rng, minCoord, span, maxSize) });
  }
  return steps;
}

function voxelSetOracle(steps: readonly RebootStep[]): bigint {
  const lit = new Set<string>();
  for (const { action, cuboid } of steps) {
    for (let x = cuboid.x.start; x <= cuboid.x.end; x += 1n) {
      for (let y = cuboid.y.start; y <= cuboid.y.end; y += 1n) {
        for (let z = cuboid.z.start; z <= cuboid.z.end; z += 1n) {
          const key = `${x},${y},${z}`;
          if (action === 'on') lit.add(key);
          else lit.delete(key);
        }
      }
    }
  }
  return BigInt(lit.size);
}

function cuboidKey(c: Cuboid): string {
  return `${c.x.start},${c.x.end},${c.y.start},${c.y.end},${c.z.start},${c.z.end}`;
}

function addSignedEntry(
  map: Map<string, { cuboid: Cuboid; sign: bigint }>,
  cuboid: Cuboid,
  delta: bigint,
): void {
  const key = cuboidKey(cuboid);
  const next = (map.get(key)?.sign ?? 0n) + delta;
  if (next === 0n) map.delete(key);
  else map.set(key, { cuboid, sign: next });
}

function inclusionExclusionOracle(steps: readonly RebootStep[]): bigint {
  const terms = new Map<string, { cuboid: Cuboid; sign: bigint }>();
  for (const { action, cuboid } of steps) {
    for (const entry of Array.from(terms.values())) {
      const inter = entry.cuboid.intersection(cuboid);
      if (inter !== null) addSignedEntry(terms, inter, -entry.sign);
    }
    if (action === 'on') addSignedEntry(terms, cuboid, 1n);
  }
  let sum = 0n;
  for (const entry of terms.values()) sum += entry.cuboid.volume * entry.sign;
  return sum;
}

describe('reactor execution engine', () => {
  it('reproduces the official 4-step initialization progression (27 -> 46 -> 38 -> 39)', () => {
    const steps = parseRebootSteps([
      'on x=10..12,y=10..12,z=10..12',
      'on x=11..13,y=11..13,z=11..13',
      'off x=9..11,y=9..11,z=9..11',
      'on x=10..10,y=10..10,z=10..10',
    ].join('\n'));
    const counts: bigint[] = [];
    let state: readonly Cuboid[] = [];
    for (const step of steps) {
      state = applyRebootStep(state, step, INITIALIZATION_POLICY);
      counts.push(totalOnVolume(state));
    }
    expect(counts).toEqual([27n, 46n, 38n, 39n]);
  });

  it('handles off on empty state, straddle clipping, and outside steps', () => {
    const steps = parseRebootSteps([
      'off x=0..5,y=0..5,z=0..5',
      'on x=-60..-49,y=0..1,z=0..1',
      'on x=51..60,y=0..1,z=0..1',
    ].join('\n'));
    const finalCuboids = executeReboot(steps, INITIALIZATION_POLICY);
    expect(totalOnVolume(finalCuboids)).toBe(2n * 2n * 2n);

    const direct = applyEffectiveStep(finalCuboids, 'off', finalCuboids[0]!);
    expect(totalOnVolume(direct)).toBe(0n);
  });

  it('handles full-reactor mode at > 2^63 coordinates without precision loss', () => {
    const base = 1n << 65n;
    const steps = parseRebootSteps([
      `on x=${base}..${base + 9n},y=0..9,z=0..9`,
      `off x=${base + 5n}..${base + 12n},y=0..4,z=0..9`,
    ].join('\n'));
    expect(totalOnVolume(executeReboot(steps, FULL_REACTOR_POLICY))).toBe(1000n - 5n * 5n * 10n);
  });

  it('matches an independent 3D voxel Set oracle and remains pairwise disjoint across 20 seeds', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const steps = generateSteps(seed, 16, -6n, 9, 4);
      const cuboids = executeReboot(steps, FULL_REACTOR_POLICY);
      expect(totalOnVolume(cuboids)).toBe(voxelSetOracle(steps));
      for (let i = 0; i < cuboids.length; i += 1) {
        for (let j = i + 1; j < cuboids.length; j += 1) {
          expect(cuboids[i]!.overlaps(cuboids[j]!)).toBe(false);
        }
      }
    }
  });

  it('matches an independent coalesced Inclusion-Exclusion oracle across 20 >2^63 seeds', () => {
    const origin = (1n << 64n) - 500n;
    for (let seed = 101; seed <= 120; seed += 1) {
      const steps = generateSteps(seed, 10, origin, 400, 350);
      const cuboids = executeReboot(steps, FULL_REACTOR_POLICY);
      expect(totalOnVolume(cuboids)).toBe(inclusionExclusionOracle(steps));
    }
  });
});
