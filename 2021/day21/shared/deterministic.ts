import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import {
  DIE_SIDES,
  DeterministicTurnFrame,
  DiracDiceInput,
  advanceSpace,
  type PlayerId,
} from './types';

export const DEFAULT_DETERMINISTIC_TARGET = 1000;
export const DEFAULT_MAX_TRACE_STEPS = 120;

interface GameCursor {
  p1Pos: number;
  p2Pos: number;
  p1Score: number;
  p2Score: number;
  winner: PlayerId | null;
}

function assertTargetScore(targetScore: number): void {
  if (!Number.isInteger(targetScore) || targetScore < 1) {
    throw new RangeError(`targetScore must be a positive integer, got ${targetScore}`);
  }
}

function rollTurnTriplet(turn: number): readonly [number, number, number] {
  const base = 3 * (turn - 1);
  return [
    (base % DIE_SIDES) + 1,
    ((base + 1) % DIE_SIDES) + 1,
    ((base + 2) % DIE_SIDES) + 1,
  ];
}

function advanceTurn(
  cursor: GameCursor,
  turn: number,
  targetScore: number,
): readonly [number, number, number] {
  const rolls = rollTurnTriplet(turn);
  const sum = rolls[0] + rolls[1] + rolls[2];
  if (turn % 2 === 1) {
    cursor.p1Pos = advanceSpace(cursor.p1Pos, sum);
    cursor.p1Score += cursor.p1Pos;
    if (cursor.p1Score >= targetScore) cursor.winner = 1;
  } else {
    cursor.p2Pos = advanceSpace(cursor.p2Pos, sum);
    cursor.p2Score += cursor.p2Pos;
    if (cursor.p2Score >= targetScore) cursor.winner = 2;
  }
  return rolls;
}

function buildFrame(
  turn: number,
  activePlayer: PlayerId | null,
  rolls: readonly [number, number, number] | null,
  cursor: GameCursor,
): DeterministicTurnFrame {
  return new DeterministicTurnFrame({
    turn,
    activePlayer,
    rolls,
    p1Pos: cursor.p1Pos,
    p2Pos: cursor.p2Pos,
    p1Score: cursor.p1Score,
    p2Score: cursor.p2Score,
    winner: cursor.winner,
  });
}

/** Runs a deterministic 100-sided die game and returns losingScore * totalDieRolls. */
export function solveDeterministicGame(input: DiracDiceInput, targetScore: number): number {
  assertTargetScore(targetScore);
  const cursor: GameCursor = {
    p1Pos: input.player1,
    p2Pos: input.player2,
    p1Score: 0,
    p2Score: 0,
    winner: null,
  };
  let turn = 0;
  while (cursor.winner === null) {
    turn += 1;
    advanceTurn(cursor, turn, targetScore);
  }
  const losingScore = cursor.winner === 1 ? cursor.p2Score : cursor.p1Score;
  return losingScore * (turn * 3);
}

/** Traces a deterministic game into sampled immutable DeterministicTurnFrame snapshots. */
export function traceDeterministicGame(
  input: DiracDiceInput,
  targetScore: number,
  options?: TraceOptions,
): readonly DeterministicTurnFrame[] {
  assertTargetScore(targetScore);
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const cursor: GameCursor = {
    p1Pos: input.player1,
    p2Pos: input.player2,
    p1Score: 0,
    p2Score: 0,
    winner: null,
  };
  const frames: DeterministicTurnFrame[] = [buildFrame(0, null, null, cursor)];
  let turn = 0;
  while (cursor.winner === null) {
    turn += 1;
    const rolls = advanceTurn(cursor, turn, targetScore);
    frames.push(buildFrame(turn, turn % 2 === 1 ? 1 : 2, rolls, cursor));
  }
  const indices = sampleTraceIndices(frames.length, maxSteps);
  return Object.freeze(indices.map((index) => frames[index]!));
}
