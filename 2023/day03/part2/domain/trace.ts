import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../../shared/core';
import { type EngineSchematic, type PartNumber, type SchematicSymbol } from '../../shared';
import { gearRatioOf } from './gearRatio';

/** Default upper bound on trace frames emitted for interactive playback. */
export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Immutable snapshot of evaluating one `'*'` candidate during Part 2 gear scanning. */
export class GearTraceFrame {
  readonly candidateIndex: number;
  readonly totalCandidates: number;
  readonly symbol: SchematicSymbol;
  readonly adjacentParts: readonly PartNumber[];
  readonly confirmedGearIds: readonly number[];
  readonly gearPartIds: readonly number[];
  readonly runningSum: bigint;

  constructor(
    candidateIndex: number,
    totalCandidates: number,
    symbol: SchematicSymbol,
    adjacentParts: readonly PartNumber[],
    confirmedGearIds: readonly number[],
    gearPartIds: readonly number[],
    runningSum: bigint,
  ) {
    if (!symbol.isGearCandidate) {
      throw new RangeError(`GearTraceFrame requires a '*' candidate symbol, got ${JSON.stringify(symbol.char)}`);
    }
    this.candidateIndex = candidateIndex;
    this.totalCandidates = totalCandidates;
    this.symbol = symbol;
    this.adjacentParts = Object.freeze(adjacentParts.slice());
    this.confirmedGearIds = Object.freeze(confirmedGearIds.slice());
    this.gearPartIds = Object.freeze(gearPartIds.slice());
    this.runningSum = runningSum;
    Object.freeze(this);
  }

  get isGear(): boolean {
    return this.adjacentParts.length === 2;
  }

  get ratio(): bigint {
    return gearRatioOf(this.adjacentParts) ?? 0n;
  }

  get gearCount(): number {
    return this.confirmedGearIds.length;
  }
}

function recordConfirmedGear(
  symbolId: number,
  adjacent: readonly PartNumber[],
  confirmedGearIds: number[],
  gearPartIds: number[],
  seenPartIds: Set<number>,
): void {
  confirmedGearIds.push(symbolId);
  for (const part of adjacent) {
    if (!seenPartIds.has(part.id)) {
      seenPartIds.add(part.id);
      gearPartIds.push(part.id);
    }
  }
}

/** Generates sampled trace frames across `'*'` candidates while keeping exact cumulative totals. */
export function traceGears(
  schematic: EngineSchematic,
  options?: TraceOptions,
): readonly GearTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const candidates = schematic.symbols.filter((s) => s.isGearCandidate);
  if (candidates.length === 0) return Object.freeze([]);
  const sampledSet = new Set(sampleTraceIndices(candidates.length, maxSteps));
  const confirmedGearIds: number[] = [];
  const gearPartIds: number[] = [];
  const seenPartIds = new Set<number>();
  const frames: GearTraceFrame[] = [];
  let runningSum = 0n;
  for (let i = 0; i < candidates.length; i += 1) {
    const symbol = candidates[i]!;
    const adjacent = schematic.adjacentNumbersOf(symbol);
    const ratio = gearRatioOf(adjacent);
    if (ratio !== null) {
      runningSum += ratio;
      recordConfirmedGear(symbol.id, adjacent, confirmedGearIds, gearPartIds, seenPartIds);
    }
    if (sampledSet.has(i)) {
      frames.push(
        new GearTraceFrame(i, candidates.length, symbol, adjacent, confirmedGearIds, gearPartIds, runningSum),
      );
    }
  }
  return Object.freeze(frames);
}
