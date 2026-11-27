import type { PocketSlice } from './model';
import type { PocketDimensionCount, PocketPolicy } from './policies';
import { type CellVisualState, type LatticeEnvelope, PocketCycleTraceFrame, PocketSliceSnapshot } from './trace';

interface LatticeLayout {
  readonly margin: number;
  readonly wOffset: number;
  readonly sy: number;
  readonly sz: number;
  readonly sw: number;
  readonly totalCells: number;
  readonly axisStrides: readonly number[];
}

const DIFF_CODES: readonly CellVisualState[] = [0, 3, 2, 1];

function buildLayout(seed: PocketSlice, dimensions: PocketDimensionCount, cycles: number): LatticeLayout {
  const margin = cycles + 1;
  const sy = seed.width + 2 * margin;
  const sz = sy * (seed.height + 2 * margin);
  const sw = sz * (1 + 2 * margin);
  const sizeW = dimensions === 4 ? 1 + 2 * margin : 1;
  const axisStrides = dimensions === 4 ? [1, sy, sz, sw] : [1, sy, sz];
  return { margin, wOffset: dimensions === 4 ? margin : 0, sy, sz, sw, totalCells: sw * sizeW, axisStrides };
}

function envelopeForCycle(seed: PocketSlice, dimensions: PocketDimensionCount, cycle: number): LatticeEnvelope {
  return {
    xMin: -cycle, xMax: seed.width - 1 + cycle,
    yMin: -cycle, yMax: seed.height - 1 + cycle,
    zMin: -cycle, zMax: cycle,
    wMin: dimensions === 4 ? -cycle : 0, wMax: dimensions === 4 ? cycle : 0,
  };
}

function convolveAxis(src: Uint8Array, dst: Uint8Array, layout: LatticeLayout, env: LatticeEnvelope, stride: number): void {
  const { margin: m, wOffset, sy, sz, sw } = layout;
  for (let w = env.wMin + wOffset; w <= env.wMax + wOffset; w += 1) {
    const wBase = w * sw;
    for (let z = env.zMin + m; z <= env.zMax + m; z += 1) {
      const zBase = wBase + z * sz;
      for (let y = env.yMin + m; y <= env.yMax + m; y += 1) {
        const rowBase = zBase + y * sy;
        for (let x = env.xMin + m; x <= env.xMax + m; x += 1) {
          const idx = rowBase + x;
          dst[idx] = src[idx - stride]! + src[idx]! + src[idx + stride]!;
        }
      }
    }
  }
}

function runSeparableBoxSum(cur: Uint8Array, tmpA: Uint8Array, tmpB: Uint8Array, layout: LatticeLayout, env: LatticeEnvelope): Uint8Array {
  let src = cur;
  let dst = tmpA;
  let alt = tmpB;
  for (const stride of layout.axisStrides) {
    convolveAxis(src, dst, layout, env, stride);
    src = dst;
    dst = alt;
    alt = src;
  }
  return src;
}

function applyConwayTransition(cur: Uint8Array, sumBuf: Uint8Array, next: Uint8Array, layout: LatticeLayout, env: LatticeEnvelope): void {
  const { margin: m, wOffset, sy, sz, sw } = layout;
  for (let w = env.wMin + wOffset; w <= env.wMax + wOffset; w += 1) {
    const wBase = w * sw;
    for (let z = env.zMin + m; z <= env.zMax + m; z += 1) {
      const zBase = wBase + z * sz;
      for (let y = env.yMin + m; y <= env.yMax + m; y += 1) {
        const rowBase = zBase + y * sy;
        for (let x = env.xMin + m; x <= env.xMax + m; x += 1) {
          const idx = rowBase + x;
          const sum = sumBuf[idx]!;
          next[idx] = sum === 3 || (sum === 4 && cur[idx]! === 1) ? 1 : 0;
        }
      }
    }
  }
}

function extractSliceSnapshot(
  cur: Uint8Array, prev: Uint8Array, layout: LatticeLayout, env: LatticeEnvelope, z: number, w: number,
): PocketSliceSnapshot | null {
  const { margin: m, wOffset, sy, sz, sw } = layout;
  const width = env.xMax - env.xMin + 1;
  const height = env.yMax - env.yMin + 1;
  const cells = new Uint8Array(width * height);
  const planeBase = (w + wOffset) * sw + (z + m) * sz;
  let hasActivity = false;

  for (let ry = 0; ry < height; ry += 1) {
    const rowBase = planeBase + (env.yMin + ry + m) * sy + env.xMin + m;
    for (let rx = 0; rx < width; rx += 1) {
      const idx = rowBase + rx;
      const code = DIFF_CODES[(cur[idx]! << 1) | prev[idx]!]!;
      cells[ry * width + rx] = code;
      if (code !== 0) hasActivity = true;
    }
  }
  if (!hasActivity && !(z === 0 && w === 0)) return null;
  return new PocketSliceSnapshot(z, w, env.xMin, env.yMin, width, height, cells);
}

/** 3D/4D Conway Cubes simulator using separable 1D box-sum convolution. */
export class PocketLattice {
  readonly #seed: PocketSlice;
  readonly #policy: PocketPolicy;
  readonly #layout: LatticeLayout;
  #cur: Uint8Array;
  #next: Uint8Array;
  readonly #tmpA: Uint8Array;
  readonly #tmpB: Uint8Array;
  #cycle = 0;

  constructor(seed: PocketSlice, policy: PocketPolicy) {
    if (!Number.isInteger(policy.cycles) || policy.cycles < 0) {
      throw new RangeError(`cycles must be a non-negative integer, got ${policy.cycles}`);
    }
    this.#seed = seed;
    this.#policy = policy;
    this.#layout = buildLayout(seed, policy.dimensions, policy.cycles);
    this.#cur = new Uint8Array(this.#layout.totalCells);
    this.#next = new Uint8Array(this.#layout.totalCells);
    this.#tmpA = new Uint8Array(this.#layout.totalCells);
    this.#tmpB = new Uint8Array(this.#layout.totalCells);
    this.#seedInitialPlane();
  }

  #seedInitialPlane(): void {
    const { margin: m, wOffset, sy, sz, sw } = this.#layout;
    const base = wOffset * sw + m * sz;
    for (let y = 0; y < this.#seed.height; y += 1) {
      for (let x = 0; x < this.#seed.width; x += 1) {
        if (this.#seed.isActive(x, y)) this.#cur[base + (y + m) * sy + (x + m)] = 1;
      }
    }
  }

  get cycle(): number { return this.#cycle; }
  get maxCycles(): number { return this.#policy.cycles; }
  get dimensions(): PocketDimensionCount { return this.#policy.dimensions; }

  get activeCount(): number {
    let count = 0;
    for (const v of this.#cur) count += v;
    return count;
  }

  stepCycle(): void {
    if (this.#cycle >= this.#policy.cycles) {
      throw new RangeError(`Cannot advance past maxCycles (${this.#policy.cycles})`);
    }
    const nextCycle = this.#cycle + 1;
    const env = envelopeForCycle(this.#seed, this.#policy.dimensions, nextCycle);
    const sumBuf = runSeparableBoxSum(this.#cur, this.#tmpA, this.#tmpB, this.#layout, env);
    applyConwayTransition(this.#cur, sumBuf, this.#next, this.#layout, env);
    const prev = this.#cur;
    this.#cur = this.#next;
    this.#next = prev;
    this.#cycle = nextCycle;
  }

  snapshotFrame(): PocketCycleTraceFrame {
    const env = envelopeForCycle(this.#seed, this.#policy.dimensions, this.#cycle);
    const prev = this.#cycle === 0 ? this.#cur : this.#next;
    const slices: PocketSliceSnapshot[] = [];
    for (let w = env.wMin; w <= env.wMax; w += 1) {
      for (let z = env.zMin; z <= env.zMax; z += 1) {
        const snap = extractSliceSnapshot(this.#cur, prev, this.#layout, env, z, w);
        if (snap !== null) slices.push(snap);
      }
    }
    return new PocketCycleTraceFrame(this.#cycle, this.#policy.cycles, this.#policy.dimensions, env, slices);
  }
}
