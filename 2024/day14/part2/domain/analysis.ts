import { euclideanMod, lcmBigInt } from '../../../../shared/core';
import type { Robot, TorusSpace } from '../../shared';

export const MAX_SCAN_UINT32 = 0xffff_ffff;

interface RobotBuffers {
  readonly xs: Uint32Array;
  readonly ys: Uint32Array;
  readonly vxs: Uint32Array;
  readonly vys: Uint32Array;
}

/** Immutable full-period adjacency time series with dynamic summary getters. */
export class EasterEggAnalysis {
  readonly space: TorusSpace;
  readonly adjacencySeries: readonly number[];

  constructor(space: TorusSpace, adjacencySeries: readonly number[]) {
    if (adjacencySeries.length === 0) {
      throw new RangeError('adjacencySeries must not be empty');
    }
    this.space = space;
    this.adjacencySeries = Object.freeze([...adjacencySeries]);
    Object.freeze(this);
  }

  get period(): number {
    return this.adjacencySeries.length;
  }

  get bestSecond(): number {
    let bestT = 0;
    let bestScore = this.adjacencySeries[0]!;
    for (let t = 1; t < this.adjacencySeries.length; t += 1) {
      const score = this.adjacencySeries[t]!;
      if (score > bestScore) {
        bestScore = score;
        bestT = t;
      }
    }
    return bestT;
  }

  get peakAdjacency(): number {
    return this.adjacencySeries[this.bestSecond]!;
  }

  get baselineMeanAdjacency(): number {
    let total = 0;
    for (const score of this.adjacencySeries) total += score;
    return total / this.adjacencySeries.length;
  }
}

/** Computes the exact recurrence period `lcm(width, height)` of the toroidal swarm. */
export function computeCyclePeriod(space: TorusSpace): number {
  return Number(lcmBigInt(BigInt(space.width), BigInt(space.height)));
}

function initRobotBuffers(robots: readonly Robot[], space: TorusSpace): RobotBuffers {
  const n = robots.length;
  const xs = new Uint32Array(n);
  const ys = new Uint32Array(n);
  const vxs = new Uint32Array(n);
  const vys = new Uint32Array(n);
  for (let i = 0; i < n; i += 1) {
    const r = robots[i]!;
    xs[i] = euclideanMod(r.x, space.width);
    ys[i] = euclideanMod(r.y, space.height);
    vxs[i] = euclideanMod(r.vx, space.width);
    vys[i] = euclideanMod(r.vy, space.height);
  }
  return { xs, ys, vxs, vys };
}

function stampAndAdvance(
  buffers: RobotBuffers,
  stamp: Uint32Array,
  occupiedIdx: Uint32Array,
  occupiedX: Uint32Array,
  space: TorusSpace,
  gen: number,
): number {
  const { width, height } = space;
  const { xs, ys, vxs, vys } = buffers;
  let unique = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const x = xs[i]!;
    const y = ys[i]!;
    const idx = y * width + x;
    if (stamp[idx] !== gen) {
      stamp[idx] = gen;
      occupiedIdx[unique] = idx;
      occupiedX[unique] = x;
      unique += 1;
    }
    xs[i] = (x + vxs[i]!) % width;
    ys[i] = (y + vys[i]!) % height;
  }
  return unique;
}

function countStampedPairs(
  stamp: Uint32Array,
  occupiedIdx: Uint32Array,
  occupiedX: Uint32Array,
  uniqueCount: number,
  space: TorusSpace,
  gen: number,
): number {
  const { width, area } = space;
  let pairs = 0;
  for (let k = 0; k < uniqueCount; k += 1) {
    const idx = occupiedIdx[k]!;
    if (occupiedX[k]! + 1 < width && stamp[idx + 1] === gen) pairs += 1;
    if (idx + width < area && stamp[idx + width] === gen) pairs += 1;
  }
  return pairs;
}

/** Scans `t = 0..period - 1` using uint32 generation stamps to score orthogonal cell adjacency. */
export function analyzeEasterEgg(robots: readonly Robot[], space: TorusSpace): EasterEggAnalysis {
  if (robots.length === 0) {
    throw new RangeError('robots must not be empty');
  }
  const period = computeCyclePeriod(space);
  if (Math.max(period, space.area) > MAX_SCAN_UINT32) {
    throw new RangeError(`scan period/area exceeds uint32 limit: ${period} / ${space.area}`);
  }
  const buffers = initRobotBuffers(robots, space);
  const stamp = new Uint32Array(space.area);
  const occupiedIdx = new Uint32Array(robots.length);
  const occupiedX = new Uint32Array(robots.length);
  const scores: number[] = new Array<number>(period);

  for (let t = 0; t < period; t += 1) {
    const gen = t + 1;
    const unique = stampAndAdvance(buffers, stamp, occupiedIdx, occupiedX, space, gen);
    scores[t] = countStampedPairs(stamp, occupiedIdx, occupiedX, unique, space, gen);
  }
  return new EasterEggAnalysis(space, scores);
}

/** Finds the earliest second in `[0, period - 1]` maximizing orthogonal occupied cell pairs. */
export function findEasterEggSecond(robots: readonly Robot[], space: TorusSpace): number {
  return analyzeEasterEgg(robots, space).bestSecond;
}
