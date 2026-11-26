import {
  type PuzzleSolver,
  type TraceOptions,
  sampleTraceIndices,
  validateMaxSteps,
} from '../../../shared/core';
import {
  type DirectionalCostTable,
  buildDirectionalCostTable,
  buildNumericSequence,
  reconstructLayerSequences,
  solveDoorCode,
  solveDoorCodes,
} from './dp';
import { ChainSolveResult, type CodeComplexity, type DoorCode, type KeypadConfig } from './model';
import { parseDoorCodes } from './parser';

export const DEFAULT_MAX_TRACE_STEPS = 64;
export const DEFAULT_MAX_RECONSTRUCT_LENGTH = 512;

export type KeypadConundrumPhase = 'table' | 'code' | 'complete';

/** Immutable visualization frame capturing DP cost table, solved codes, and active layer chains. */
export class KeypadConundrumSnapshot {
  readonly phase: KeypadConundrumPhase;
  readonly config: KeypadConfig;
  readonly table: DirectionalCostTable;
  readonly result: ChainSolveResult;
  readonly activeDepth: number;
  readonly activeCodeIndex: number | null;
  readonly revealedCodeCount: number;
  readonly activeNumericSeq: string | null;
  readonly activeLayers: readonly string[] | null;

  constructor(
    phase: KeypadConundrumPhase,
    config: KeypadConfig,
    table: DirectionalCostTable,
    result: ChainSolveResult,
    activeDepth: number,
    activeCodeIndex: number | null,
    revealedCodeCount: number,
    activeNumericSeq: string | null,
    activeLayers: readonly string[] | null,
  ) {
    this.phase = phase;
    this.config = config;
    this.table = table;
    this.result = result;
    this.activeDepth = activeDepth;
    this.activeCodeIndex = activeCodeIndex;
    this.revealedCodeCount = revealedCodeCount;
    this.activeNumericSeq = activeNumericSeq;
    this.activeLayers = activeLayers;
    Object.freeze(this);
  }

  get activeEntry(): CodeComplexity | null {
    return this.activeCodeIndex === null ? null : this.result.entries[this.activeCodeIndex]!;
  }

  get revealedComplexity(): bigint {
    let total = 0n;
    for (let i = 0; i < this.revealedCodeCount; i += 1) {
      total += this.result.entries[i]!.complexity;
    }
    return total;
  }
}

function makeCodeSnapshot(
  phase: KeypadConundrumPhase,
  config: KeypadConfig,
  table: DirectionalCostTable,
  result: ChainSolveResult,
  codeIndex: number,
  revealedCount: number,
): KeypadConundrumSnapshot {
  const code = result.entries[codeIndex]!.code;
  const numericSeq = buildNumericSequence(code, table);
  const layers = reconstructLayerSequences(code, table, DEFAULT_MAX_RECONSTRUCT_LENGTH);
  return new KeypadConundrumSnapshot(
    phase,
    config,
    table,
    result,
    config.directionalRobots,
    codeIndex,
    revealedCount,
    numericSeq,
    layers,
  );
}

function buildPreCompleteFrames(
  config: KeypadConfig,
  table: DirectionalCostTable,
  result: ChainSolveResult,
): readonly KeypadConundrumSnapshot[] {
  const frames: KeypadConundrumSnapshot[] = [];
  for (let depth = 0; depth <= config.directionalRobots; depth += 1) {
    frames.push(new KeypadConundrumSnapshot('table', config, table, result, depth, null, 0, null, null));
  }
  for (let i = 0; i < result.entries.length; i += 1) {
    frames.push(makeCodeSnapshot('code', config, table, result, i, i + 1));
  }
  return frames;
}

/** Builds a bounded visualization trace across DP table depths and solved door codes. */
export function buildKeypadTrace(
  codes: readonly DoorCode[],
  config: KeypadConfig,
  options?: TraceOptions,
): readonly KeypadConundrumSnapshot[] {
  if (codes.length === 0) {
    throw new RangeError('buildKeypadTrace requires at least one DoorCode');
  }
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const table = buildDirectionalCostTable(config.directionalRobots);
  const result = new ChainSolveResult(config, codes.map((code) => solveDoorCode(code, table)));
  const lastIdx = result.entries.length - 1;
  const completeFrame = makeCodeSnapshot('complete', config, table, result, lastIdx, result.entries.length);
  if (limit === 1) return Object.freeze([completeFrame]);

  const preComplete = buildPreCompleteFrames(config, table, result);
  const sampled = sampleTraceIndices(preComplete.length, limit - 1).map((idx) => preComplete[idx]!);
  return Object.freeze([...sampled, completeFrame]);
}

/** Creates a pure `PuzzleSolver` parameterized by `KeypadConfig`. */
export function createKeypadConundrumSolver(
  config: KeypadConfig,
): PuzzleSolver<readonly DoorCode[], bigint, KeypadConundrumSnapshot> {
  return Object.freeze({
    parse: (raw: string) => parseDoorCodes(raw),
    solve: (codes: readonly DoorCode[]) => solveDoorCodes(codes, config).totalComplexity,
    trace: (codes: readonly DoorCode[], options?: TraceOptions) =>
      buildKeypadTrace(codes, config, options),
  });
}
