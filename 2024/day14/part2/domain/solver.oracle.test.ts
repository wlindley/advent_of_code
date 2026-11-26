import { describe, expect, it } from 'vitest';
import { euclideanMod } from '../../../../shared/core';
import {
  DEFAULT_REDOUBT_SPACE,
  Robot,
  TorusSpace,
  countAdjacentOccupied,
  fillOccupancy,
} from '../../shared';
import { analyzeEasterEgg, findEasterEggSecond } from './index';

class SeededRng {
  #state: number;

  constructor(seed: number) {
    this.#state = seed >>> 0;
  }

  next(): number {
    this.#state = (1664525 * this.#state + 1013904223) >>> 0;
    return this.#state;
  }
}

function minVarianceResidue(
  starts: readonly number[],
  vels: readonly number[],
  mod: number,
): number {
  const n = BigInt(starts.length);
  let bestT = 0;
  let bestVar = -1n;
  for (let t = 0; t < mod; t += 1) {
    let sum = 0n;
    let sumSq = 0n;
    for (let i = 0; i < starts.length; i += 1) {
      const pos = BigInt(euclideanMod(starts[i]! + t * vels[i]!, mod));
      sum += pos;
      sumSq += pos * pos;
    }
    const scaledVar = n * sumSq - sum * sum;
    if (bestVar < 0n || scaledVar < bestVar) {
      bestVar = scaledVar;
      bestT = t;
    }
  }
  return bestT;
}

function modInverseBigInt(a: bigint, m: bigint): bigint {
  let [oldR, r] = [a % m, m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return ((oldS % m) + m) % m;
}

function varianceCrtOracle(robots: readonly Robot[], space: TorusSpace): number {
  const tx = BigInt(minVarianceResidue(robots.map((r) => r.x), robots.map((r) => r.vx), space.width));
  const ty = BigInt(minVarianceResidue(robots.map((r) => r.y), robots.map((r) => r.vy), space.height));
  const w = BigInt(space.width);
  const h = BigInt(space.height);
  const k = ((((ty - tx) % h) + h) % h) * modInverseBigInt(w, h) % h;
  return Number(tx + w * k);
}

function buildSyntheticTree15x13(targetSecond: number): readonly Robot[] {
  const rows: ReadonlyArray<readonly [number, readonly number[]]> = [
    [1, [7]], [2, [6, 7, 8]], [3, [5, 6, 7, 8, 9]],
    [4, [6, 7, 8]], [5, [5, 6, 7, 8, 9]], [6, [4, 5, 6, 7, 8, 9, 10]],
    [7, [5, 6, 7, 8, 9]], [8, [4, 5, 6, 7, 8, 9, 10]], [9, [7]],
  ];
  const vxPool = [-7, -4, -2, -1, 1, 2, 4, 7];
  const vyPool = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
  const robots: Robot[] = [];
  let idx = 0;
  for (const [ty, xs] of rows) {
    for (const tx of xs) {
      const vx = vxPool[(idx * 3 + 1) % vxPool.length]!;
      const vy = vyPool[(idx * 5 + 2) % vyPool.length]!;
      const x0 = euclideanMod(tx - targetSecond * vx, 15);
      const y0 = euclideanMod(ty - targetSecond * vy, 13);
      robots.push(new Robot(x0, y0, vx, vy));
      idx += 1;
    }
  }
  return robots;
}

function buildSeededSwarm101x103(targetSecond: number, seed: number): readonly Robot[] {
  const rng = new SeededRng(seed);
  const robots: Robot[] = [];
  for (let row = 0; row < 20; row += 1) {
    for (let dx = -row; dx <= row && robots.length < 340; dx += 1) {
      const vx = (rng.next() % 100) - 50 || 1;
      const vy = (rng.next() % 102) - 51 || 1;
      const x0 = euclideanMod(50 + dx - targetSecond * vx, 101);
      const y0 = euclideanMod(40 + row - targetSecond * vy, 103);
      robots.push(new Robot(x0, y0, vx, vy));
    }
  }
  while (robots.length < 500) {
    const vx = (rng.next() % 101) - 50;
    const vy = (rng.next() % 103) - 51;
    robots.push(new Robot(rng.next() % 101, rng.next() % 103, vx, vy));
  }
  return robots;
}

describe('day14 part2 differential oracles', () => {
  it('matches exact occupancy adjacency count at every frame on 7x5 grid', () => {
    const space = new TorusSpace(7, 5);
    const robots = [
      new Robot(6, 0, 1, 0),
      new Robot(0, 0, -1, 0),
      new Robot(6, 4, 0, 1),
      new Robot(6, 4, 0, 1),
      new Robot(3, 2, -2, -3),
      new Robot(2, 2, 3, -1),
      new Robot(10, 8, -7, 5),
    ];
    const analysis = analyzeEasterEgg(robots, space);
    expect(analysis.period).toBe(35);
    const buf = new Uint32Array(space.area);
    for (let t = 0; t < analysis.period; t += 1) {
      const expected = countAdjacentOccupied(fillOccupancy(robots, space, t, buf), space);
      expect(analysis.adjacencySeries[t]).toBe(expected);
    }
  });

  it('matches independent BigInt variance-CRT oracle on 15x13 tree and 500-robot 101x103 swarm', () => {
    const smallSpace = new TorusSpace(15, 13);
    const smallTree = buildSyntheticTree15x13(42);
    expect(findEasterEggSecond(smallTree, smallSpace)).toBe(42);
    expect(varianceCrtOracle(smallTree, smallSpace)).toBe(42);

    const swarm = buildSeededSwarm101x103(6876, 20241402);
    expect(findEasterEggSecond(swarm, DEFAULT_REDOUBT_SPACE)).toBe(6876);
    expect(varianceCrtOracle(swarm, DEFAULT_REDOUBT_SPACE)).toBe(6876);
  });
});
