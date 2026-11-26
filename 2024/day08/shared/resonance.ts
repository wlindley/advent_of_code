import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { AntennaMap, GridPoint } from './map';

export const DEFAULT_MAX_TRACE_STEPS = 300;

export interface PairProjection {
  readonly inBounds: readonly GridPoint[];
  readonly outOfBounds: readonly GridPoint[];
}

export interface AntinodeProjectionRule {
  readonly id: string;
  readonly label: string;
  projectPair(a: GridPoint, b: GridPoint, rows: number, cols: number): PairProjection;
}

export interface ResonanceTraceFrameInit {
  readonly stepIndex: number;
  readonly totalPairs: number;
  readonly frequency: string;
  readonly anchorA: GridPoint;
  readonly anchorB: GridPoint;
  readonly inBounds: readonly GridPoint[];
  readonly outOfBounds: readonly GridPoint[];
  readonly added: readonly GridPoint[];
  readonly duplicates: readonly GridPoint[];
  readonly cumulativeAntinodes: readonly GridPoint[];
}

/** Immutable trace frame capturing one sampled antenna-pair projection step. */
export class ResonanceTraceFrame {
  readonly stepIndex: number;
  readonly totalPairs: number;
  readonly frequency: string;
  readonly anchorA: GridPoint;
  readonly anchorB: GridPoint;
  readonly inBounds: readonly GridPoint[];
  readonly outOfBounds: readonly GridPoint[];
  readonly added: readonly GridPoint[];
  readonly duplicates: readonly GridPoint[];
  readonly cumulativeAntinodes: readonly GridPoint[];

  constructor(init: ResonanceTraceFrameInit) {
    this.stepIndex = init.stepIndex;
    this.totalPairs = init.totalPairs;
    this.frequency = init.frequency;
    this.anchorA = init.anchorA;
    this.anchorB = init.anchorB;
    this.inBounds = Object.freeze(init.inBounds.slice());
    this.outOfBounds = Object.freeze(init.outOfBounds.slice());
    this.added = Object.freeze(init.added.slice());
    this.duplicates = Object.freeze(init.duplicates.slice());
    this.cumulativeAntinodes = Object.freeze(init.cumulativeAntinodes.slice());
    Object.freeze(this);
  }

  get uniqueCount(): number {
    return this.cumulativeAntinodes.length;
  }
}

interface AntennaPair {
  readonly frequency: string;
  readonly a: GridPoint;
  readonly b: GridPoint;
}

function collectAntennaPairs(map: AntennaMap): readonly AntennaPair[] {
  const pairs: AntennaPair[] = [];
  for (const [frequency, points] of map.frequencyGroups) {
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        pairs.push({ frequency, a: points[i]!, b: points[j]! });
      }
    }
  }
  return pairs;
}

function recordInBounds(
  map: AntennaMap,
  seen: Uint8Array,
  points: readonly GridPoint[],
  cumulative: GridPoint[],
): { readonly added: GridPoint[]; readonly duplicates: GridPoint[] } {
  const added: GridPoint[] = [];
  const duplicates: GridPoint[] = [];
  for (const pt of points) {
    if (!map.inBounds(pt.row, pt.col)) {
      throw new RangeError(`Rule emitted out-of-bounds inBounds point (${pt.row}, ${pt.col})`);
    }
    const idx = pt.row * map.cols + pt.col;
    if (seen[idx] === 0) {
      seen[idx] = 1;
      cumulative.push(pt);
      added.push(pt);
    } else {
      duplicates.push(pt);
    }
  }
  return { added, duplicates };
}

/** Collects all unique in-bounds antinodes produced by applying `rule` to same-frequency pairs. */
export function collectAntinodes(map: AntennaMap, rule: AntinodeProjectionRule): readonly GridPoint[] {
  const seen = new Uint8Array(map.rows * map.cols);
  const cumulative: GridPoint[] = [];
  for (const pair of collectAntennaPairs(map)) {
    const projection = rule.projectPair(pair.a, pair.b, map.rows, map.cols);
    recordInBounds(map, seen, projection.inBounds, cumulative);
  }
  return Object.freeze(cumulative);
}

/** Runs `rule` across all pairs while recording a uniformly sampled bounded trace of frames. */
export function traceAntinodes(
  map: AntennaMap,
  rule: AntinodeProjectionRule,
  options?: TraceOptions,
): readonly ResonanceTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const pairs = collectAntennaPairs(map);
  const sampledIndices = sampleTraceIndices(pairs.length, maxSteps);
  const seen = new Uint8Array(map.rows * map.cols);
  const cumulative: GridPoint[] = [];
  const frames: ResonanceTraceFrame[] = [];
  let sampleCursor = 0;

  for (let i = 0; i < pairs.length; i += 1) {
    const pair = pairs[i]!;
    const projection = rule.projectPair(pair.a, pair.b, map.rows, map.cols);
    const { added, duplicates } = recordInBounds(map, seen, projection.inBounds, cumulative);
    if (sampledIndices[sampleCursor] === i) {
      frames.push(
        new ResonanceTraceFrame({
          stepIndex: i,
          totalPairs: pairs.length,
          frequency: pair.frequency,
          anchorA: pair.a,
          anchorB: pair.b,
          inBounds: projection.inBounds,
          outOfBounds: projection.outOfBounds,
          added,
          duplicates,
          cumulativeAntinodes: cumulative,
        }),
      );
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
