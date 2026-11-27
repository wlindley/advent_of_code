import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { BOARD_SPACES, DiracDiceInput, QuantumTraceFrame, type PlayerId } from './types';

export const DEFAULT_QUANTUM_TARGET = 21;
const DEFAULT_QUANTUM_MAX_TRACE_STEPS = 120;

export const DIRAC_ROLL_DISTRIBUTION: readonly (readonly [number, bigint])[] = Object.freeze([
  [3, 1n], [4, 3n], [5, 6n], [6, 7n], [7, 6n], [8, 3n], [9, 1n],
]);

interface WavefrontState {
  curCounts: bigint[];
  nextCounts: bigint[];
  curActive: number[];
  nextActive: number[];
  p1Wins: bigint;
  p2Wins: bigint;
}

function assertTargetScore(targetScore: number): void {
  if (!Number.isInteger(targetScore) || targetScore < 1) {
    throw new RangeError(`targetScore must be a positive integer, got ${targetScore}`);
  }
}

function createWavefront(input: DiracDiceInput, targetScore: number): WavefrontState {
  const totalStates = BOARD_SPACES * BOARD_SPACES * targetScore * targetScore;
  const curCounts = Array<bigint>(totalStates).fill(0n);
  const nextCounts = Array<bigint>(totalStates).fill(0n);
  const startIdx = ((input.player1 - 1) * BOARD_SPACES + (input.player2 - 1)) * targetScore * targetScore;
  curCounts[startIdx] = 1n;
  return { curCounts, nextCounts, curActive: [startIdx], nextActive: [], p1Wins: 0n, p2Wins: 0n };
}

function pushActiveState(counts: bigint[], active: number[], idx: number, ways: bigint): void {
  const prev = counts[idx]!;
  if (prev === 0n) active.push(idx);
  counts[idx] = prev + ways;
}

function expandState(
  state: WavefrontState,
  activePlayer: PlayerId,
  targetScore: number,
  p1Pos0: number,
  p2Pos0: number,
  p1Score: number,
  p2Score: number,
  count: bigint,
): void {
  const basePos0 = activePlayer === 1 ? p1Pos0 : p2Pos0;
  const baseScore = activePlayer === 1 ? p1Score : p2Score;
  for (const [rollSum, mult] of DIRAC_ROLL_DISTRIBUTION) {
    const ways = count * mult;
    const nextPos0 = (basePos0 + rollSum) % BOARD_SPACES;
    const nextScore = baseScore + nextPos0 + 1;
    if (nextScore >= targetScore) {
      if (activePlayer === 1) state.p1Wins += ways;
      else state.p2Wins += ways;
    } else {
      const nextIdx =
        activePlayer === 1
          ? ((nextPos0 * BOARD_SPACES + p2Pos0) * targetScore + nextScore) * targetScore + p2Score
          : ((p1Pos0 * BOARD_SPACES + nextPos0) * targetScore + p1Score) * targetScore + nextScore;
      pushActiveState(state.nextCounts, state.nextActive, nextIdx, ways);
    }
  }
}

function stepRound(state: WavefrontState, targetScore: number, activePlayer: PlayerId): void {
  const { curCounts, nextCounts, curActive, nextActive } = state;
  nextActive.length = 0;
  for (let i = 0; i < curActive.length; i += 1) {
    const idx = curActive[i]!;
    const count = curCounts[idx]!;
    // O(|active|) reset keeps nextCounts zeroed across rounds without a full-buffer fill.
    curCounts[idx] = 0n;
    const p2Score = idx % targetScore;
    const rem1 = (idx - p2Score) / targetScore;
    const p1Score = rem1 % targetScore;
    const rem2 = (rem1 - p1Score) / targetScore;
    const p2Pos0 = rem2 % BOARD_SPACES;
    const p1Pos0 = (rem2 - p2Pos0) / BOARD_SPACES;
    expandState(state, activePlayer, targetScore, p1Pos0, p2Pos0, p1Score, p2Score, count);
  }
  state.curCounts = nextCounts;
  state.nextCounts = curCounts;
  state.curActive = nextActive;
  state.nextActive = curActive;
}

function computeSpaceWeights(
  active: readonly number[],
  counts: readonly bigint[],
  targetScore: number,
): { readonly p1: bigint[]; readonly p2: bigint[] } {
  const p1 = Array<bigint>(BOARD_SPACES).fill(0n);
  const p2 = Array<bigint>(BOARD_SPACES).fill(0n);
  const targetSq = targetScore * targetScore;
  for (let i = 0; i < active.length; i += 1) {
    const idx = active[i]!;
    const count = counts[idx]!;
    const posCode = Math.floor(idx / targetSq);
    const p2Pos0 = posCode % BOARD_SPACES;
    const p1Pos0 = (posCode - p2Pos0) / BOARD_SPACES;
    p1[p1Pos0] = p1[p1Pos0]! + count;
    p2[p2Pos0] = p2[p2Pos0]! + count;
  }
  return { p1, p2 };
}

function buildQuantumFrame(
  round: number,
  activePlayer: PlayerId | null,
  state: WavefrontState,
  targetScore: number,
): QuantumTraceFrame {
  const weights = computeSpaceWeights(state.curActive, state.curCounts, targetScore);
  return new QuantumTraceFrame({
    round,
    activePlayer,
    p1Wins: state.p1Wins,
    p2Wins: state.p2Wins,
    p1SpaceWeights: weights.p1,
    p2SpaceWeights: weights.p2,
  });
}

/** Counts exact winning universes for both players and returns the larger total. */
export function solveQuantumGame(input: DiracDiceInput, targetScore: number): bigint {
  assertTargetScore(targetScore);
  const state = createWavefront(input, targetScore);
  let round = 0;
  while (state.curActive.length > 0) {
    round += 1;
    stepRound(state, targetScore, round % 2 === 1 ? 1 : 2);
  }
  return state.p1Wins >= state.p2Wins ? state.p1Wins : state.p2Wins;
}

/** Traces quantum universe space distributions and cumulative wins across rounds. */
export function traceQuantumGame(
  input: DiracDiceInput,
  targetScore: number,
  options?: TraceOptions,
): readonly QuantumTraceFrame[] {
  assertTargetScore(targetScore);
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_QUANTUM_MAX_TRACE_STEPS);
  const state = createWavefront(input, targetScore);
  const frames: QuantumTraceFrame[] = [buildQuantumFrame(0, null, state, targetScore)];
  let round = 0;
  while (state.curActive.length > 0) {
    round += 1;
    const activePlayer: PlayerId = round % 2 === 1 ? 1 : 2;
    stepRound(state, targetScore, activePlayer);
    frames.push(buildQuantumFrame(round, activePlayer, state, targetScore));
  }
  const indices = sampleTraceIndices(frames.length, maxSteps);
  return Object.freeze(indices.map((index) => frames[index]!));
}
