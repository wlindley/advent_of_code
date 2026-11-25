import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { MAX_BLOCKING_NEIGHBORS, WarehouseFloor, parseWarehouse } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 250;
export const EMPTY_CELL_WAVE = 0;
export const SURVIVOR_WAVE = 0xffffffff;

export interface PeelingWaveFrame {
  readonly wave: number;
  readonly removedThisWave: number;
  readonly cumulativeRemoved: number;
}

/** Immutable wave-by-wave k-core peeling result with derived aggregate getters. */
export class PeelingResult {
  readonly removalWave: Uint32Array;
  readonly waveCounts: readonly number[];
  readonly totalRolls: number;

  constructor(removalWave: Uint32Array, waveCounts: readonly number[], totalRolls: number) {
    this.removalWave = removalWave;
    this.waveCounts = Object.freeze(waveCounts.slice());
    this.totalRolls = totalRolls;
    Object.freeze(this);
  }
  get totalWaves(): number { return this.waveCounts.length; }
  get totalRemoved(): number { return this.waveCounts.reduce((sum, n) => sum + n, 0); }
  get survivorCount(): number { return this.totalRolls - this.totalRemoved; }
}

/** Peel rolls with <4 neighbors in parallel waves using dual-offset padded buffers. */
export function peelWarehouse(floor: WarehouseFloor): PeelingResult {
  const { rows, cols } = floor;
  const stride = cols + 2, size = rows * cols;
  const { paddedOccupied, degrees } = floor.computeDegreeMap();
  const removalWave = new Uint32Array(size);
  let [current, next] = [new Uint32Array(size), new Uint32Array(size)];
  let totalRolls = 0, currLen = 0;

  for (let r = 0, idx = 0; r < rows; r += 1) {
    for (let c = 0, p = (r + 1) * stride + 1; c < cols; c += 1, idx += 1, p += 1) {
      if (paddedOccupied[p] !== 1) continue;
      totalRolls += 1;
      if (degrees[idx]! < MAX_BLOCKING_NEIGHBORS) {
        // Claim immediately so wave-1 enqueueing stays duplicate-free.
        paddedOccupied[p] = 0;
        current[currLen++] = idx;
      } else removalWave[idx] = SURVIVOR_WAVE;
    }
  }

  const paddedOffsets = [-stride - 1, -stride, -stride + 1, -1, 1, stride - 1, stride, stride + 1];
  const gridOffsets = [-cols - 1, -cols, -cols + 1, -1, 1, cols - 1, cols, cols + 1];
  const waveCounts: number[] = [];
  for (let wave = 1; currLen > 0; wave += 1) {
    let nextLen = 0;
    for (let i = 0; i < currLen; i += 1) {
      const idx = current[i]!;
      removalWave[idx] = wave;
      const r = (idx / cols) | 0, p = (r + 1) * stride + (idx - r * cols) + 1;
      for (let d = 0; d < 8; d += 1) {
        const np = p + paddedOffsets[d]!;
        if (paddedOccupied[np] !== 1) continue;
        const nIdx = idx + gridOffsets[d]!;
        if ((degrees[nIdx] = degrees[nIdx]! - 1) < MAX_BLOCKING_NEIGHBORS) {
          paddedOccupied[np] = 0;
          next[nextLen++] = nIdx;
        }
      }
    }
    waveCounts.push(currLen);
    [current, next, currLen] = [next, current, nextLen];
  }
  return new PeelingResult(removalWave, waveCounts, totalRolls);
}

export const solver: PuzzleSolver<WarehouseFloor, number, PeelingWaveFrame> = {
  parse: parseWarehouse,
  solve: (floor: WarehouseFloor) => peelWarehouse(floor).totalRemoved,
  trace(floor: WarehouseFloor, options?: TraceOptions): readonly PeelingWaveFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    const { waveCounts, totalWaves } = peelWarehouse(floor);
    if (totalWaves === 0) return [{ wave: 0, removedThisWave: 0, cumulativeRemoved: 0 }];
    const stride = maxSteps === 1 ? Infinity : totalWaves + 1 <= maxSteps ? 1 : Math.ceil(totalWaves / (maxSteps - 1));
    const frames: PeelingWaveFrame[] = maxSteps > 1 ? [{ wave: 0, removedThisWave: 0, cumulativeRemoved: 0 }] : [];
    for (let w = 1, cum = 0; w <= totalWaves; w += 1) {
      const removedThisWave = waveCounts[w - 1]!;
      cum += removedThisWave;
      if (w % stride === 0 || w === totalWaves) frames.push({ wave: w, removedThisWave, cumulativeRemoved: cum });
    }
    return frames;
  },
};
