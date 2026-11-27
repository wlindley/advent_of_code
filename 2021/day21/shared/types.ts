export const BOARD_SPACES = 10;
export const DIE_SIDES = 100;

export type PlayerId = 1 | 2;

function assertSpace(space: number, label: string): void {
  if (!Number.isInteger(space) || space < 1 || space > BOARD_SPACES) {
    throw new RangeError(`${label} must be an integer in 1..${BOARD_SPACES}, got ${space}`);
  }
}

/** Advances a 1-indexed board space clockwise around the 10-space circular track. */
export function advanceSpace(pos: number, delta: number): number {
  return ((pos - 1 + delta) % BOARD_SPACES) + 1;
}

/** Immutable validated starting positions for a 2-player Dirac Dice game. */
export class DiracDiceInput {
  readonly player1: number;
  readonly player2: number;

  constructor(player1: number, player2: number) {
    assertSpace(player1, 'player1');
    assertSpace(player2, 'player2');
    this.player1 = player1;
    this.player2 = player2;
    Object.freeze(this);
  }
}

export interface DeterministicTurnFrameInit {
  readonly turn: number;
  readonly activePlayer: PlayerId | null;
  readonly rolls: readonly [number, number, number] | null;
  readonly p1Pos: number;
  readonly p2Pos: number;
  readonly p1Score: number;
  readonly p2Score: number;
  readonly winner: PlayerId | null;
}

/** Immutable snapshot of one deterministic Dirac Dice turn (or turn 0 initial state). */
export class DeterministicTurnFrame {
  readonly turn: number;
  readonly activePlayer: PlayerId | null;
  readonly rolls: readonly [number, number, number] | null;
  readonly p1Pos: number;
  readonly p2Pos: number;
  readonly p1Score: number;
  readonly p2Score: number;
  readonly winner: PlayerId | null;

  constructor(init: DeterministicTurnFrameInit) {
    this.turn = init.turn;
    this.activePlayer = init.activePlayer;
    this.rolls = init.rolls === null ? null : Object.freeze([init.rolls[0], init.rolls[1], init.rolls[2]]);
    this.p1Pos = init.p1Pos;
    this.p2Pos = init.p2Pos;
    this.p1Score = init.p1Score;
    this.p2Score = init.p2Score;
    this.winner = init.winner;
    Object.freeze(this);
  }

  get rollCount(): number {
    return this.turn * 3;
  }

  get rollSum(): number {
    return this.rolls === null ? 0 : this.rolls[0] + this.rolls[1] + this.rolls[2];
  }

  get losingScore(): number {
    if (this.winner === 1) return this.p2Score;
    if (this.winner === 2) return this.p1Score;
    return Math.min(this.p1Score, this.p2Score);
  }

  get product(): number {
    return this.losingScore * this.rollCount;
  }
}

export interface QuantumTraceFrameInit {
  readonly round: number;
  readonly activePlayer: PlayerId | null;
  readonly p1Wins: bigint;
  readonly p2Wins: bigint;
  readonly p1SpaceWeights: readonly bigint[];
  readonly p2SpaceWeights: readonly bigint[];
}

/** Immutable post-round universe distribution snapshot for Dirac quantum play. */
export class QuantumTraceFrame {
  readonly round: number;
  readonly activePlayer: PlayerId | null;
  readonly p1Wins: bigint;
  readonly p2Wins: bigint;
  readonly p1SpaceWeights: readonly bigint[];
  readonly p2SpaceWeights: readonly bigint[];

  constructor(init: QuantumTraceFrameInit) {
    this.round = init.round;
    this.activePlayer = init.activePlayer;
    this.p1Wins = init.p1Wins;
    this.p2Wins = init.p2Wins;
    this.p1SpaceWeights = Object.freeze([...init.p1SpaceWeights]);
    this.p2SpaceWeights = Object.freeze([...init.p2SpaceWeights]);
    Object.freeze(this);
  }

  get activeUniverses(): bigint {
    return this.p1SpaceWeights.reduce((total, weight) => total + weight, 0n);
  }
}
