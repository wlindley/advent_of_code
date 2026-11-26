import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { HeightMap } from './heightMap';
import type { ReverseBfsField } from './reverseBfs';
import type { StartCondition } from './startCondition';

export const DEFAULT_MAX_TRACE_STEPS = 120;

function assertIntInRange(value: number, min: number, max: number | null, label: string): void {
  if (!Number.isInteger(value) || value < min || (max !== null && value > max)) {
    throw new RangeError(`${label} out of range: ${value}`);
  }
}

/** Immutable wavefront snapshot at reverse-BFS distance `distance` from `E`. */
export class HillClimbTraceFrame {
  readonly distance: number;
  readonly maxDistance: number;
  readonly frontierCount: number;
  readonly reachedCount: number;
  readonly winningDistance: number | null;
  readonly winningStartIndex: number | null;

  constructor(
    distance: number,
    maxDistance: number,
    frontierCount: number,
    reachedCount: number,
    winningDistance: number | null,
    winningStartIndex: number | null,
  ) {
    assertIntInRange(maxDistance, 0, null, 'maxDistance');
    assertIntInRange(distance, 0, maxDistance, 'distance');
    assertIntInRange(frontierCount, 0, null, 'frontierCount');
    assertIntInRange(reachedCount, 1, null, 'reachedCount');
    if ((winningDistance === null) !== (winningStartIndex === null)) {
      throw new Error('winningDistance and winningStartIndex must be paired');
    }
    if (winningDistance !== null) {
      assertIntInRange(winningDistance, 0, maxDistance, 'winningDistance');
      assertIntInRange(winningStartIndex!, 0, null, 'winningStartIndex');
    }
    this.distance = distance;
    this.maxDistance = maxDistance;
    this.frontierCount = frontierCount;
    this.reachedCount = reachedCount;
    this.winningDistance = winningDistance;
    this.winningStartIndex = winningStartIndex;
    Object.freeze(this);
  }

  get winningStartReached(): boolean {
    return this.winningDistance !== null && this.distance >= this.winningDistance;
  }

  get isComplete(): boolean {
    return this.distance === this.maxDistance;
  }
}

function buildCumulativeCounts(counts: readonly number[]): readonly number[] {
  const cumulative = new Array<number>(counts.length);
  let total = 0;
  for (let i = 0; i < counts.length; i += 1) {
    total += counts[i]!;
    cumulative[i] = total;
  }
  return cumulative;
}

/** Builds a bounded trace of reverse-BFS wavefront frames from `E` up to `maxReachableDistance`. */
export function buildHillClimbTrace(
  map: HeightMap,
  field: ReverseBfsField,
  condition: StartCondition,
  options?: TraceOptions,
): readonly HillClimbTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const maxDistance = field.maxReachableDistance;
  const sampled = sampleTraceIndices(maxDistance + 1, limit);
  const counts = field.countByDistance();
  const cumulative = buildCumulativeCounts(counts);
  const winningStartIndex = field.findNearestStart(map, condition);
  const winningDistance = winningStartIndex === null ? null : field.distanceAt(winningStartIndex);
  const frames: HillClimbTraceFrame[] = [];
  for (const dist of sampled) {
    frames.push(
      new HillClimbTraceFrame(
        dist,
        maxDistance,
        counts[dist]!,
        cumulative[dist]!,
        winningDistance,
        winningStartIndex,
      ),
    );
  }
  return Object.freeze(frames);
}
