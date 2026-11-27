import { sampleTraceIndices } from '../../../shared/core';
import { scoreDeck, type PlayerId } from './model';

export const DEFAULT_MAX_TRACE_STEPS = 240;

export type RoundOutcome = 'initial' | 'high-card' | 'sub-game' | 'sub-game-shortcut' | 'loop-abort';

export interface RawTraceRecord {
  readonly round: number;
  readonly deck1: readonly number[];
  readonly deck2: readonly number[];
  readonly played: readonly [number, number] | null;
  readonly roundWinner: PlayerId | null;
  readonly outcome: RoundOutcome;
  readonly subGamesStarted: number;
}

/** Immutable snapshot of a single top-level Crab Combat round with derived telemetry getters. */
export class CombatTraceFrame {
  readonly round: number;
  readonly totalRounds: number;
  readonly deck1: readonly number[];
  readonly deck2: readonly number[];
  readonly played: readonly [number, number] | null;
  readonly roundWinner: PlayerId | null;
  readonly outcome: RoundOutcome;
  readonly subGamesStarted: number;

  constructor(record: RawTraceRecord, totalRounds: number) {
    this.round = record.round;
    this.totalRounds = totalRounds;
    this.deck1 = Object.freeze([...record.deck1]);
    this.deck2 = Object.freeze([...record.deck2]);
    this.played = record.played ? Object.freeze([record.played[0], record.played[1]] as const) : null;
    this.roundWinner = record.roundWinner;
    this.outcome = record.outcome;
    this.subGamesStarted = record.subGamesStarted;
    Object.freeze(this);
  }

  get p1Score(): number {
    return scoreDeck(this.deck1);
  }

  get p2Score(): number {
    return scoreDeck(this.deck2);
  }

  get p1Count(): number {
    return this.deck1.length;
  }

  get p2Count(): number {
    return this.deck2.length;
  }

  get totalCards(): number {
    return this.deck1.length + this.deck2.length;
  }

  get isFinal(): boolean {
    return this.deck1.length === 0 || this.deck2.length === 0 || this.outcome === 'loop-abort';
  }

  get gameWinner(): PlayerId | null {
    if (this.outcome === 'loop-abort' || this.deck2.length === 0) return 1;
    if (this.deck1.length === 0) return 2;
    return null;
  }

  get winningScore(): number | null {
    const winner = this.gameWinner;
    if (winner === null) return null;
    return winner === 1 ? this.p1Score : this.p2Score;
  }
}

/** Uniformly samples raw round records into bounded immutable CombatTraceFrame objects. */
export function sampleCombatTrace(
  records: readonly RawTraceRecord[],
  maxSteps: number,
): readonly CombatTraceFrame[] {
  const last = records[records.length - 1];
  const totalRounds = last ? last.round : 0;
  const indices = sampleTraceIndices(records.length, maxSteps);
  return Object.freeze(indices.map((index) => new CombatTraceFrame(records[index]!, totalRounds)));
}
