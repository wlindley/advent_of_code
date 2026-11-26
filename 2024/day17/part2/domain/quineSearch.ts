import { validateMaxSteps } from '../../../../shared/core';
import { ChronospatialProgram, runProgram, type ThreeBitValue } from '../../shared';

export const DEFAULT_MAX_SEARCH_CANDIDATES = 100_000;
export interface QuineSearchOptions { readonly maxCandidates?: number; }

interface SearchState {
  readonly program: ChronospatialProgram;
  readonly maxCandidates: number;
  candidatesTested: number;
  backtracks: number;
}

/** Immutable record of one octal-digit choice while reconstructing Register A backward. */
export class QuineReconstructionStep {
  readonly position: number;
  readonly targetToken: ThreeBitValue;
  readonly prefix: bigint;
  readonly digit: ThreeBitValue;
  readonly matchingDigits: readonly ThreeBitValue[];

  constructor(position: number, targetToken: ThreeBitValue, prefix: bigint, digit: ThreeBitValue, matchingDigits: readonly ThreeBitValue[]) {
    if (!Number.isInteger(position) || position < 0) throw new RangeError(`Invalid position: ${position}`);
    if (prefix < 0n) throw new RangeError(`Prefix must be non-negative, got ${prefix}`);
    if (prefix === 0n && digit === 0) throw new RangeError('Leading octal digit cannot be 0');
    if (!matchingDigits.includes(digit)) throw new RangeError(`Digit ${digit} is not in matchingDigits`);
    this.position = position;
    this.targetToken = targetToken;
    this.prefix = prefix;
    this.digit = digit;
    this.matchingDigits = Object.freeze([...matchingDigits]);
    Object.freeze(this);
  }

  /** Octal prefix extended with `digit`. */
  get candidate(): bigint { return (this.prefix << 3n) | BigInt(this.digit); }
}

/** Immutable result of backward octal DFS for the lowest self-reproducing Register A. */
export class QuineSearchResult {
  readonly steps: readonly QuineReconstructionStep[];
  readonly candidatesTested: number;
  readonly backtracks: number;

  constructor(steps: readonly QuineReconstructionStep[], candidatesTested: number, backtracks: number) {
    if (steps.length < 1) throw new RangeError('QuineSearchResult requires at least one step');
    if (!Number.isInteger(candidatesTested) || candidatesTested < 1) throw new RangeError(`candidatesTested must be a positive integer, got ${candidatesTested}`);
    if (!Number.isInteger(backtracks) || backtracks < 0) throw new RangeError(`backtracks must be a non-negative integer, got ${backtracks}`);
    this.steps = Object.freeze([...steps]);
    this.candidatesTested = candidatesTested;
    this.backtracks = backtracks;
    Object.freeze(this);
  }

  /** Lowest positive Register A that reproduces the program tape. */
  get registerA(): bigint { return this.steps[this.steps.length - 1]!.candidate; }
}

function outputMatchesSuffix(output: readonly ThreeBitValue[], instructions: readonly ThreeBitValue[], pos: number): boolean {
  if (output.length !== instructions.length - pos) return false;
  for (let i = 0; i < output.length; i += 1) {
    if (output[i] !== instructions[pos + i]) return false;
  }
  return true;
}

function collectMatchingDigits(state: SearchState, pos: number, prefix: bigint): ThreeBitValue[] {
  const startDigit = prefix === 0n ? 1 : 0;
  const matches: ThreeBitValue[] = [];
  for (let d = startDigit; d <= 7; d += 1) {
    if (state.candidatesTested >= state.maxCandidates) {
      throw new RangeError(`Quine search exceeded maxCandidates (${state.maxCandidates})`);
    }
    state.candidatesTested += 1;
    const candidate = (prefix << 3n) | BigInt(d);
    const { output } = runProgram(state.program.withRegisterA(candidate));
    if (outputMatchesSuffix(output, state.program.instructions, pos)) matches.push(d as ThreeBitValue);
  }
  return matches;
}

function dfsOctalPrefix(state: SearchState, pos: number, prefix: bigint, path: QuineReconstructionStep[]): boolean {
  const matches = collectMatchingDigits(state, pos, prefix);
  const targetToken = state.program.instructions[pos]!;
  for (const digit of matches) {
    const step = new QuineReconstructionStep(pos, targetToken, prefix, digit, matches);
    path.push(step);
    if (pos === 0 || dfsOctalPrefix(state, pos - 1, step.candidate, path)) return true;
    path.pop();
    state.backtracks += 1;
  }
  return false;
}

/** Finds the lowest positive Register A producing `program.instructions` via backward octal DFS. */
export function searchLowestQuine(program: ChronospatialProgram, options?: QuineSearchOptions): QuineSearchResult {
  const maxCandidates = validateMaxSteps(options?.maxCandidates, DEFAULT_MAX_SEARCH_CANDIDATES);
  const state: SearchState = { program, maxCandidates, candidatesTested: 0, backtracks: 0 };
  const path: QuineReconstructionStep[] = [];
  const found = dfsOctalPrefix(state, program.instructions.length - 1, 0n, path);
  if (!found) throw new Error('No positive Register A produces a quine for this program');
  return new QuineSearchResult(path, state.candidatesTested, state.backtracks);
}
