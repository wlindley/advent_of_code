import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import type { Almanac, RangeRule } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Single category-to-category transition step along a seed's almanac journey. */
export class StageTransition {
  readonly mapIndex: number;
  readonly sourceCategory: string;
  readonly destCategory: string;
  readonly input: bigint;
  readonly matchedRule: RangeRule | undefined;

  constructor(
    mapIndex: number,
    sourceCategory: string,
    destCategory: string,
    input: bigint,
    matchedRule: RangeRule | undefined,
  ) {
    if (matchedRule !== undefined && !matchedRule.source.contains(input)) {
      throw new RangeError(
        `Matched rule [${matchedRule.source.start}, ${matchedRule.source.end}] does not contain input ${input}`,
      );
    }
    this.mapIndex = mapIndex;
    this.sourceCategory = sourceCategory;
    this.destCategory = destCategory;
    this.input = input;
    this.matchedRule = matchedRule;
    Object.freeze(this);
  }

  get output(): bigint {
    return this.matchedRule !== undefined ? this.matchedRule.apply(this.input) : this.input;
  }

  get delta(): bigint {
    return this.matchedRule !== undefined ? this.matchedRule.delta : 0n;
  }

  get isIdentity(): boolean {
    return this.matchedRule === undefined;
  }
}

/** Trace frame capturing one sampled seed's full stage progression and global running best. */
export class SeedJourneyFrame {
  readonly seedIndex: number;
  readonly totalSeeds: number;
  readonly transitions: readonly StageTransition[];
  readonly bestSeedIndex: number;
  readonly bestSeed: bigint;
  readonly bestLocation: bigint;

  constructor(
    seedIndex: number,
    totalSeeds: number,
    transitions: Iterable<StageTransition>,
    bestSeedIndex: number,
    bestSeed: bigint,
    bestLocation: bigint,
  ) {
    const list = Array.from(transitions);
    if (list.length === 0) {
      throw new RangeError('SeedJourneyFrame requires at least one StageTransition');
    }
    this.seedIndex = seedIndex;
    this.totalSeeds = totalSeeds;
    this.transitions = Object.freeze(list);
    this.bestSeedIndex = bestSeedIndex;
    this.bestSeed = bestSeed;
    this.bestLocation = bestLocation;
    Object.freeze(this);
  }

  get seed(): bigint {
    return this.transitions[0]!.input;
  }

  get location(): bigint {
    return this.transitions[this.transitions.length - 1]!.output;
  }

  get stageValues(): readonly bigint[] {
    const values: bigint[] = [this.seed];
    for (const transition of this.transitions) {
      values.push(transition.output);
    }
    return Object.freeze(values);
  }

  get matchedRuleCount(): number {
    let count = 0;
    for (const transition of this.transitions) {
      if (!transition.isIdentity) count += 1;
    }
    return count;
  }

  get isNewBest(): boolean {
    return this.seedIndex === this.bestSeedIndex;
  }
}

/** Maps a single seed through all almanac stages to its final location value. */
export function mapSeedToLocation(almanac: Almanac, seed: bigint): bigint {
  let current = seed;
  for (const map of almanac.maps) {
    current = map.mapValue(current);
  }
  return current;
}

/** Records every stage transition for a single seed across the almanac map chain. */
export function traceSeedJourney(almanac: Almanac, seed: bigint): readonly StageTransition[] {
  const transitions: StageTransition[] = [];
  let current = seed;
  for (let i = 0; i < almanac.maps.length; i += 1) {
    const map = almanac.maps[i]!;
    const transition = new StageTransition(
      i,
      map.sourceCategory,
      map.destCategory,
      current,
      map.findRule(current),
    );
    transitions.push(transition);
    current = transition.output;
  }
  return Object.freeze(transitions);
}

/** Computes the minimum final location across all seeds in the almanac. */
export function findLowestLocation(almanac: Almanac): bigint {
  let best = mapSeedToLocation(almanac, almanac.seeds[0]!);
  for (let i = 1; i < almanac.seeds.length; i += 1) {
    const location = mapSeedToLocation(almanac, almanac.seeds[i]!);
    if (location < best) best = location;
  }
  return best;
}

/** Traces up to `maxSteps` uniformly sampled seed journeys while tracking exact global best. */
export function traceAlmanac(almanac: Almanac, options?: TraceOptions): readonly SeedJourneyFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(almanac.seeds.length, limit);
  let bestSeedIndex = 0;
  let bestSeed = almanac.seeds[0]!;
  let bestLocation = mapSeedToLocation(almanac, bestSeed);
  const frames: SeedJourneyFrame[] = [];
  let sampleCursor = 0;

  for (let i = 0; i < almanac.seeds.length; i += 1) {
    const seed = almanac.seeds[i]!;
    const location = i === 0 ? bestLocation : mapSeedToLocation(almanac, seed);
    if (location < bestLocation) {
      bestLocation = location;
      bestSeed = seed;
      bestSeedIndex = i;
    }
    if (sampled[sampleCursor]! === i) {
      frames.push(
        new SeedJourneyFrame(
          i,
          almanac.seeds.length,
          traceSeedJourney(almanac, seed),
          bestSeedIndex,
          bestSeed,
          bestLocation,
        ),
      );
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
