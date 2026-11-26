import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../../shared/core';
import { type EngineSchematic, type PartNumber, type SchematicSymbol } from '../../shared';

/** Default upper bound on trace frames emitted for interactive playback. */
export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Immutable snapshot of evaluating one symbol during Part 1 schematic scanning. */
export class SchematicTraceFrame {
  readonly symbolIndex: number;
  readonly totalSymbols: number;
  readonly symbol: SchematicSymbol;
  readonly adjacentParts: readonly PartNumber[];
  readonly newlyMatchedIds: readonly number[];
  readonly matchedPartIds: readonly number[];
  readonly runningSum: number;

  constructor(
    symbolIndex: number,
    totalSymbols: number,
    symbol: SchematicSymbol,
    adjacentParts: readonly PartNumber[],
    newlyMatchedIds: readonly number[],
    matchedPartIds: readonly number[],
    runningSum: number,
  ) {
    this.symbolIndex = symbolIndex;
    this.totalSymbols = totalSymbols;
    this.symbol = symbol;
    this.adjacentParts = Object.freeze(adjacentParts);
    this.newlyMatchedIds = Object.freeze(newlyMatchedIds);
    this.matchedPartIds = Object.freeze(matchedPartIds);
    this.runningSum = runningSum;
    Object.freeze(this);
  }

  get matchedCount(): number {
    return this.matchedPartIds.length;
  }

  get newlyMatchedCount(): number {
    return this.newlyMatchedIds.length;
  }

  /** Sum of part numbers newly claimed at this symbol step. */
  get stepDelta(): number {
    if (this.newlyMatchedIds.length === 0) return 0;
    const newlySet = new Set(this.newlyMatchedIds);
    let delta = 0;
    for (const part of this.adjacentParts) {
      if (newlySet.has(part.id)) delta += part.value;
    }
    return delta;
  }
}

/** Sums every unique part number adjacent to at least one symbol in `schematic`. */
export function sumPartNumbers(schematic: EngineSchematic): number {
  const seen = new Uint8Array(schematic.numbers.length);
  let sum = 0;
  for (const symbol of schematic.symbols) {
    for (const part of schematic.adjacentNumbersOf(symbol)) {
      if (!seen[part.id]) {
        seen[part.id] = 1;
        sum += part.value;
      }
    }
  }
  return sum;
}

function claimNewParts(
  adjacent: readonly PartNumber[],
  seen: Uint8Array,
  matchedIds: number[],
  newlyMatched: number[],
): number {
  let delta = 0;
  for (const part of adjacent) {
    if (!seen[part.id]) {
      seen[part.id] = 1;
      matchedIds.push(part.id);
      newlyMatched.push(part.id);
      delta += part.value;
    }
  }
  return delta;
}

/** Generates sampled trace frames across symbols while keeping exact cumulative totals. */
export function traceSchematic(
  schematic: EngineSchematic,
  options?: TraceOptions,
): readonly SchematicTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalSymbols = schematic.symbols.length;
  if (totalSymbols === 0) return Object.freeze([]);
  const sampledSet = new Set(sampleTraceIndices(totalSymbols, maxSteps));
  const seen = new Uint8Array(schematic.numbers.length);
  const matchedIds: number[] = [];
  const frames: SchematicTraceFrame[] = [];
  let runningSum = 0;
  for (let i = 0; i < totalSymbols; i += 1) {
    const symbol = schematic.symbols[i]!;
    const adjacent = schematic.adjacentNumbersOf(symbol);
    const newlyMatched: number[] = [];
    runningSum += claimNewParts(adjacent, seen, matchedIds, newlyMatched);
    if (sampledSet.has(i)) {
      frames.push(
        new SchematicTraceFrame(i, totalSymbols, symbol, adjacent, newlyMatched, matchedIds.slice(), runningSum),
      );
    }
  }
  return Object.freeze(frames);
}
