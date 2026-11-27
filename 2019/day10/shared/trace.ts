import { type TraceOptions, sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { AsteroidMap } from './asteroidMap';
import { AsteroidPoint } from './geometry';
import {
  type VaporizationEvent,
  analyzeVisibility,
  computeVaporizationSchedule,
  findVisibleTargets,
} from './visibility';

export const DEFAULT_MAX_TRACE_FRAMES = 100;

export interface MonitorScanFrameData {
  readonly stepIndex: number;
  readonly totalCandidates: number;
  readonly candidate: AsteroidPoint;
  readonly visibleTargets: readonly AsteroidPoint[];
  readonly bestStation: AsteroidPoint;
  readonly bestDetectedCount: number;
  readonly counts: readonly number[];
  readonly minDetectedCount: number;
  readonly maxDetectedCount: number;
}

/** Trace snapshot for one candidate station scan in Part 1. */
export class MonitorScanTraceFrame {
  readonly kind = 'monitor-scan' as const;
  readonly stepIndex: number;
  readonly totalCandidates: number;
  readonly candidate: AsteroidPoint;
  readonly visibleTargets: readonly AsteroidPoint[];
  readonly bestStation: AsteroidPoint;
  readonly bestDetectedCount: number;
  readonly counts: readonly number[];
  readonly minDetectedCount: number;
  readonly maxDetectedCount: number;

  constructor(data: MonitorScanFrameData) {
    this.stepIndex = data.stepIndex;
    this.totalCandidates = data.totalCandidates;
    this.candidate = data.candidate;
    this.visibleTargets = Object.freeze([...data.visibleTargets]);
    this.bestStation = data.bestStation;
    this.bestDetectedCount = data.bestDetectedCount;
    this.counts = data.counts;
    this.minDetectedCount = data.minDetectedCount;
    this.maxDetectedCount = data.maxDetectedCount;
    Object.freeze(this);
  }

  get detectedCount(): number { return this.visibleTargets.length; }
  get isNewBest(): boolean { return this.candidate.x === this.bestStation.x && this.candidate.y === this.bestStation.y; }
  get isFinalStep(): boolean { return this.stepIndex === this.totalCandidates - 1; }
}

/** Trace snapshot for clockwise laser vaporization progress in Part 2. */
export class VaporizationTraceFrame {
  readonly kind = 'vaporization' as const;
  readonly station: AsteroidPoint;
  readonly targetOrder: number;
  readonly vaporized: readonly VaporizationEvent[];
  readonly totalTargets: number;

  constructor(station: AsteroidPoint, targetOrder: number, vaporized: readonly VaporizationEvent[], totalTargets: number) {
    this.station = station;
    this.targetOrder = targetOrder;
    this.vaporized = Object.freeze([...vaporized]);
    this.totalTargets = totalTargets;
    Object.freeze(this);
  }

  get vaporizedCount(): number { return this.vaporized.length; }
  get remainingCount(): number { return this.totalTargets - this.vaporized.length; }
  get activeEvent(): VaporizationEvent | null { return this.vaporized.length === 0 ? null : this.vaporized[this.vaporized.length - 1]!; }
  get isTargetReached(): boolean { return this.vaporized.length >= this.targetOrder; }
  get isFinalStep(): boolean { return this.vaporized.length === this.totalTargets; }
}

export type StationTraceFrame = MonitorScanTraceFrame | VaporizationTraceFrame;

function createMonitorFrame(
  map: AsteroidMap,
  analysis: ReturnType<typeof analyzeVisibility>,
  idx: number,
  bestIdx: number,
): MonitorScanTraceFrame {
  return new MonitorScanTraceFrame({
    stepIndex: idx,
    totalCandidates: map.asteroidCount,
    candidate: map.asteroidAt(idx),
    visibleTargets: findVisibleTargets(map, idx),
    bestStation: map.asteroidAt(bestIdx),
    bestDetectedCount: analysis.counts[bestIdx]!,
    counts: analysis.counts,
    minDetectedCount: analysis.minDetectedCount,
    maxDetectedCount: analysis.maxDetectedCount,
  });
}

/** Builds a bounded trace of candidate monitoring-station scans for `map`. */
export function buildMonitorScanTrace(map: AsteroidMap, options?: TraceOptions): readonly MonitorScanTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_FRAMES);
  const analysis = analyzeVisibility(map);
  const sampled = sampleTraceIndices(map.asteroidCount, maxSteps);
  const frames: MonitorScanTraceFrame[] = [];
  let bestIdx = 0;
  let cursor = 0;

  for (let idx = 0; idx < map.asteroidCount; idx += 1) {
    if (analysis.counts[idx]! > analysis.counts[bestIdx]!) bestIdx = idx;
    if (idx === sampled[cursor]) {
      frames.push(createMonitorFrame(map, analysis, idx, bestIdx));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

/** Builds a bounded trace of clockwise laser vaporizations starting from 0 vaporized. */
export function buildVaporizationTrace(
  map: AsteroidMap,
  targetOrder: number,
  options?: TraceOptions,
): readonly VaporizationTraceFrame[] {
  if (!Number.isInteger(targetOrder) || targetOrder < 1) {
    throw new RangeError(`targetOrder must be a positive integer, got ${targetOrder}`);
  }
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_FRAMES);
  const analysis = analyzeVisibility(map);
  const schedule = computeVaporizationSchedule(map, analysis.bestIndex);
  const sampled = sampleTraceIndices(schedule.length + 1, maxSteps);
  const frames: VaporizationTraceFrame[] = [];
  for (const count of sampled) {
    frames.push(new VaporizationTraceFrame(analysis.bestStation, targetOrder, schedule.slice(0, count), schedule.length));
  }
  return Object.freeze(frames);
}
