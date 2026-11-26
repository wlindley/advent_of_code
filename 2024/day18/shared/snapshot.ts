import { type TraceOptions, sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { findShortestPath } from './bfs';
import { type ByteCoord, type MemorySpace, NEVER_CORRUPTED, UNVISITED } from './model';

export const DEFAULT_MAX_TRACE_STEPS = 80;
export type RamRunPhase = 'corrupting' | 'wave' | 'complete';

export interface StaticSnapshotOptions {
  readonly phase?: RamRunPhase;
  readonly waveLimit?: number;
  readonly latestByte?: ByteCoord | null;
  readonly blockingByte?: ByteCoord | null;
  readonly showPath?: boolean;
}

interface TraceBuffers {
  readonly memory: MemorySpace;
  readonly firstFall: Int32Array;
  readonly distances: Int32Array;
}

/** Immutable grid snapshot for rendering byte corruption, BFS wave expansion, and shortest path. */
export class RamRunSnapshot {
  readonly memory: MemorySpace;
  readonly phase: RamRunPhase;
  readonly fallenCount: number;
  readonly waveDistanceLimit: number;
  readonly latestByte: ByteCoord | null;
  readonly blockingByte: ByteCoord | null;
  readonly path: readonly ByteCoord[];
  private readonly firstFall: Int32Array;
  private readonly distances: Int32Array;

  constructor(
    buf: TraceBuffers,
    phase: RamRunPhase,
    fallenCount: number,
    waveDistanceLimit: number,
    latestByte: ByteCoord | null,
    blockingByte: ByteCoord | null,
    path: readonly ByteCoord[],
  ) {
    this.memory = buf.memory;
    this.phase = phase;
    this.fallenCount = fallenCount;
    this.waveDistanceLimit = waveDistanceLimit;
    this.latestByte = latestByte;
    this.blockingByte = blockingByte;
    this.path = path;
    this.firstFall = buf.firstFall;
    this.distances = buf.distances;
    Object.freeze(this);
  }

  get reachable(): boolean { return this.path.length > 0; }
  get shortestDistance(): number | null { return this.path.length > 0 ? this.path.length - 1 : null; }

  get maxWaveDistance(): number {
    let max = -1;
    for (let i = 0; i < this.distances.length; i += 1) {
      const d = this.distances[i]!;
      if (d !== UNVISITED && d <= this.waveDistanceLimit && d > max) max = d;
    }
    return max;
  }

  get revealedVisitedCount(): number {
    let count = 0;
    for (let i = 0; i < this.distances.length; i += 1) {
      const d = this.distances[i]!;
      if (d !== UNVISITED && d <= this.waveDistanceLimit) count += 1;
    }
    return count;
  }

  isCorruptedAt(x: number, y: number): boolean {
    const fall = this.firstFall[this.memory.cellIndex(x, y)]!;
    return fall !== NEVER_CORRUPTED && fall < this.fallenCount;
  }

  distanceAt(x: number, y: number): number {
    const d = this.distances[this.memory.cellIndex(x, y)]!;
    return d !== UNVISITED && d <= this.waveDistanceLimit ? d : UNVISITED;
  }
}

/** Builds a single static snapshot after `fallenCount` bytes fall. */
export function createStaticSnapshot(
  memory: MemorySpace,
  fallenCount: number,
  options: StaticSnapshotOptions = {},
): RamRunSnapshot {
  const result = findShortestPath(memory, fallenCount);
  const phase = options.phase ?? 'complete';
  const latest = options.latestByte !== undefined
    ? options.latestByte
    : result.fallenCount > 0 ? memory.bytes[result.fallenCount - 1]! : null;
  const showPath = options.showPath ?? phase === 'complete';
  const buf: TraceBuffers = { memory, firstFall: memory.copyFirstFallIndices(), distances: result.copyDistances() };
  return new RamRunSnapshot(buf, phase, result.fallenCount, options.waveLimit ?? result.maxDistance, latest, options.blockingByte ?? null, showPath ? result.path : []);
}

function splitBudgets(preBudget: number, fallTotal: number, waveTotal: number): readonly [number, number] {
  if (waveTotal === 0) return [preBudget, 0];
  if (fallTotal === 0) return [0, preBudget];
  if (preBudget === 1) return [1, 0];
  const fallBudget = Math.max(1, Math.min(preBudget - 1, Math.round((preBudget * fallTotal) / (fallTotal + waveTotal))));
  return [fallBudget, preBudget - fallBudget];
}

/** Builds an endpoint-preserving corruption + BFS wave trace capped to `options.maxSteps`. */
export function buildCorruptionAndWaveTrace(
  memory: MemorySpace,
  fallenCount: number,
  options?: TraceOptions,
): readonly RamRunSnapshot[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const result = findShortestPath(memory, fallenCount);
  const buf: TraceBuffers = { memory, firstFall: memory.copyFirstFallIndices(), distances: result.copyDistances() };
  const applied = result.fallenCount;
  const latest = applied > 0 ? memory.bytes[applied - 1]! : null;
  const complete = new RamRunSnapshot(buf, 'complete', applied, result.maxDistance, latest, null, result.path);
  if (limit === 1) return Object.freeze([complete]);

  const fallTotal = applied > 0 ? applied + 1 : 0;
  const waveTotal = result.maxDistance >= 0 ? result.maxDistance + 1 : 0;
  const [fallBudget, waveBudget] = splitBudgets(limit - 1, fallTotal, waveTotal);
  const frames: RamRunSnapshot[] = [];
  if (fallBudget > 0) {
    for (const k of sampleTraceIndices(fallTotal, fallBudget)) {
      frames.push(new RamRunSnapshot(buf, 'corrupting', k, UNVISITED, k > 0 ? memory.bytes[k - 1]! : null, null, []));
    }
  }
  if (waveBudget > 0) {
    for (const w of sampleTraceIndices(waveTotal, waveBudget)) {
      frames.push(new RamRunSnapshot(buf, 'wave', applied, w, null, null, []));
    }
  }
  frames.push(complete);
  return Object.freeze(frames);
}
