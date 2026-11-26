import {
  IntervalUnion,
  sampleTraceIndices,
  validateMaxSteps,
  type ClosedInterval,
  type TraceOptions,
} from '../../../../shared/core';
import type { Almanac } from '../../shared';
import {
  mapIntervalUnion,
  parseSeedRanges,
  splitUnionByMap,
  type FlowRibbon,
} from './intervals';

export const DEFAULT_MAX_TRACE_STEPS = 200;

function collectOutputUnion(ribbons: readonly FlowRibbon[]): IntervalUnion {
  const destinations: ClosedInterval[] = [];
  for (const ribbon of ribbons) {
    destinations.push(ribbon.destination);
  }
  return new IntervalUnion(destinations);
}

/** Immutable trace frame capturing how one `RangeMap` stage splits and shifts an `IntervalUnion`. */
export class IntervalStageFrame {
  readonly stageIndex: number;
  readonly totalStages: number;
  readonly sourceCategory: string;
  readonly destCategory: string;
  readonly ribbons: readonly FlowRibbon[];

  constructor(
    stageIndex: number,
    totalStages: number,
    sourceCategory: string,
    destCategory: string,
    ribbons: Iterable<FlowRibbon>,
  ) {
    if (stageIndex < 0 || stageIndex >= totalStages) {
      throw new RangeError(`stageIndex (${stageIndex}) must be in [0, ${totalStages - 1}]`);
    }
    const list = Array.from(ribbons);
    if (list.length === 0) {
      throw new RangeError('IntervalStageFrame ribbons must not be empty');
    }
    this.stageIndex = stageIndex;
    this.totalStages = totalStages;
    this.sourceCategory = sourceCategory;
    this.destCategory = destCategory;
    this.ribbons = Object.freeze(list);
    Object.freeze(this);
  }

  get input(): IntervalUnion {
    const sources: ClosedInterval[] = [];
    for (const ribbon of this.ribbons) {
      sources.push(ribbon.source);
    }
    return new IntervalUnion(sources);
  }

  get output(): IntervalUnion {
    return collectOutputUnion(this.ribbons);
  }

  get minOutput(): bigint {
    return this.output.intervals[0]!.start;
  }

  get matchedRibbonCount(): number {
    let count = 0;
    for (const ribbon of this.ribbons) {
      if (!ribbon.isIdentity) count += 1;
    }
    return count;
  }

  get identityRibbonCount(): number {
    return this.ribbons.length - this.matchedRibbonCount;
  }
}

/** Computes the minimum final location reachable from any Part 2 seed range. */
export function findLowestRangeLocation(almanac: Almanac): bigint {
  let current = parseSeedRanges(almanac.seeds);
  for (const map of almanac.maps) {
    current = mapIntervalUnion(current, map);
  }
  return current.intervals[0]!.start;
}

/** Records sampled stage frames across the almanac pipeline up to `options.maxSteps`. */
export function traceAlmanacRanges(
  almanac: Almanac,
  options?: TraceOptions,
): readonly IntervalStageFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(almanac.maps.length, limit);
  let current = parseSeedRanges(almanac.seeds);
  const frames: IntervalStageFrame[] = [];
  let sampleCursor = 0;

  for (let i = 0; i < almanac.maps.length; i += 1) {
    const map = almanac.maps[i]!;
    const ribbons = splitUnionByMap(current, map);
    if (sampled[sampleCursor] === i) {
      frames.push(
        new IntervalStageFrame(i, almanac.maps.length, map.sourceCategory, map.destCategory, ribbons),
      );
      sampleCursor += 1;
    }
    current = collectOutputUnion(ribbons);
  }
  return Object.freeze(frames);
}
