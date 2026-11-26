import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import type { HeightmapAnalysis } from './basin';
import { BasinFloodFrame, LowPointScanFrame, type BasinWaveSnapshot, type SmokeBasinTraceFrame } from './trace';

export type SmokeBasinPolicyId = 'low-point-risk' | 'largest-basins-product';

export interface SmokeBasinPolicy {
  readonly id: SmokeBasinPolicyId;
  readonly label: string;
  readonly metricLabel: string;
  evaluate(analysis: HeightmapAnalysis): number;
  buildTrace(analysis: HeightmapAnalysis, maxSteps: number): readonly SmokeBasinTraceFrame[];
}

/** Part 1 policy: sum of `(1 + height)` over all strict low points. */
export class LowPointRiskPolicy implements SmokeBasinPolicy {
  readonly id = 'low-point-risk' as const;
  readonly label = 'Low-Point Risk Sum';
  readonly metricLabel = 'Risk Level';

  constructor() { Object.freeze(this); }

  evaluate(analysis: HeightmapAnalysis): number {
    return analysis.totalRiskLevel;
  }

  buildTrace(analysis: HeightmapAnalysis, maxSteps: number): readonly SmokeBasinTraceFrame[] {
    validateMaxSteps(maxSteps, maxSteps);
    const count = analysis.lowPoints.length;
    if (count === 0) return Object.freeze([new LowPointScanFrame(analysis, 0)]);
    const indices = sampleTraceIndices(count, maxSteps);
    return Object.freeze(indices.map((idx) => new LowPointScanFrame(analysis, idx + 1)));
  }
}

export const LOW_POINT_RISK_POLICY: SmokeBasinPolicy = new LowPointRiskPolicy();

interface WaveBuckets {
  readonly offsets: Int32Array;
  readonly cellBasins: Int32Array;
}

function groupCellsByWave(analysis: HeightmapAnalysis, maxWave: number): WaveBuckets {
  const { rows, cols } = analysis.heightmap;
  const counts = new Int32Array(maxWave + 1);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const d = analysis.waveDepthAt(r, c);
      if (d !== null) counts[d]! += 1;
    }
  }
  const offsets = new Int32Array(maxWave + 2);
  for (let d = 0; d <= maxWave; d += 1) offsets[d + 1] = offsets[d]! + counts[d]!;
  const cellBasins = new Int32Array(offsets[maxWave + 1]!);
  const cursor = offsets.slice(0, maxWave + 1);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const d = analysis.waveDepthAt(r, c);
      if (d !== null) {
        const pos = cursor[d]!;
        cursor[d] = pos + 1;
        cellBasins[pos] = analysis.basinIdAt(r, c)!;
      }
    }
  }
  return { offsets, cellBasins };
}

function selectTopSnapshots(revealedByBasin: Int32Array, topCount: number): readonly BasinWaveSnapshot[] {
  const snapshots: BasinWaveSnapshot[] = [];
  for (let id = 0; id < revealedByBasin.length; id += 1) {
    snapshots.push({ basinId: id, revealedSize: revealedByBasin[id]! });
  }
  snapshots.sort((a, b) => (b.revealedSize !== a.revealedSize ? b.revealedSize - a.revealedSize : a.basinId - b.basinId));
  return snapshots.slice(0, topCount);
}

/** Part 2 policy: product of the `topCount` largest non-ridge basins. */
export class LargestBasinsProductPolicy implements SmokeBasinPolicy {
  readonly id = 'largest-basins-product' as const;
  readonly label: string;
  readonly metricLabel = 'Top Basin Product';
  readonly topCount: number;

  constructor(topCount: number) {
    if (!Number.isInteger(topCount) || topCount < 1) {
      throw new RangeError(`topCount must be a positive integer, got ${topCount}`);
    }
    this.topCount = topCount;
    this.label = `Top ${topCount} Basins Product`;
    Object.freeze(this);
  }

  private assertEnoughBasins(analysis: HeightmapAnalysis): void {
    if (analysis.basins.length < this.topCount) {
      throw new RangeError(`Expected at least ${this.topCount} basins, found ${analysis.basins.length}`);
    }
  }

  evaluate(analysis: HeightmapAnalysis): number {
    this.assertEnoughBasins(analysis);
    const sizes = analysis.basins.map((b) => b.size).sort((a, b) => b - a);
    let product = 1;
    for (let i = 0; i < this.topCount; i += 1) product *= sizes[i]!;
    return product;
  }

  buildTrace(analysis: HeightmapAnalysis, maxSteps: number): readonly SmokeBasinTraceFrame[] {
    validateMaxSteps(maxSteps, maxSteps);
    this.assertEnoughBasins(analysis);
    const maxWave = analysis.maxWaveDepth;
    const sampledWaves = sampleTraceIndices(maxWave + 1, maxSteps);
    const { offsets, cellBasins } = groupCellsByWave(analysis, maxWave);
    const revealedByBasin = new Int32Array(analysis.basins.length);
    const frames: BasinFloodFrame[] = [];
    let revealedCellCount = 0;
    let samplePos = 0;
    for (let d = 0; d <= maxWave; d += 1) {
      const start = offsets[d]!;
      const end = offsets[d + 1]!;
      revealedCellCount += end - start;
      for (let i = start; i < end; i += 1) revealedByBasin[cellBasins[i]!]! += 1;
      if (sampledWaves[samplePos] === d) {
        samplePos += 1;
        frames.push(new BasinFloodFrame(analysis, d, revealedCellCount, selectTopSnapshots(revealedByBasin, this.topCount)));
      }
    }
    return Object.freeze(frames);
  }
}

export const LARGEST_BASINS_PRODUCT_POLICY: SmokeBasinPolicy = Object.freeze(new LargestBasinsProductPolicy(3));
