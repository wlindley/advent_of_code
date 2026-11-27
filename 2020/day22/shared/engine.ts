import { validateMaxSteps } from '../../../shared/core';
import { DeckRingBuffer, encodeStateKey } from './deck';
import { scoreDeck, type CombatDecks, type PlayerId } from './model';
import {
  DEFAULT_MAX_TRACE_STEPS,
  sampleCombatTrace,
  type CombatTraceFrame,
  type RawTraceRecord,
  type RoundOutcome,
} from './trace';

export interface CombatResult {
  readonly winner: PlayerId;
  readonly score: number;
  readonly rounds: number;
  readonly subGamesStarted: number;
  readonly abortedByLoop: boolean;
}

interface GameCounter {
  subGamesStarted: number;
}

interface GameOutcome {
  readonly winner: PlayerId;
  readonly rounds: number;
  readonly abortedByLoop: boolean;
}

function pushTrace(
  records: RawTraceRecord[] | null,
  round: number,
  d1: DeckRingBuffer,
  d2: DeckRingBuffer,
  played: readonly [number, number] | null,
  roundWinner: PlayerId | null,
  outcome: RoundOutcome,
  subGamesStarted: number,
): void {
  if (records === null) return;
  records.push({
    round, deck1: d1.toArray(), deck2: d2.toArray(),
    played, roundWinner, outcome, subGamesStarted,
  });
}

function resolveRound(
  c1: number,
  c2: number,
  d1: DeckRingBuffer,
  d2: DeckRingBuffer,
  recursive: boolean,
  useCompactKey: boolean,
  counter: GameCounter,
): { readonly winner: PlayerId; readonly outcome: RoundOutcome } {
  if (recursive && d1.size >= c1 && d2.size >= c2) {
    counter.subGamesStarted += 1;
    const subCap = c1 + c2;
    const subD1 = d1.copyPrefix(c1, subCap);
    const subD2 = d2.copyPrefix(c2, subCap);
    // Pigeonhole principle: P1 owning the strictly highest card in a sub-game cannot lose it
    // (any tie-breaking sub-game either resolves by high card or aborts to P1 on repeat).
    if (subD1.maxCard() > subD2.maxCard()) {
      return { winner: 1, outcome: 'sub-game-shortcut' };
    }
    const subResult = playGame(subD1, subD2, true, useCompactKey, counter, null);
    return { winner: subResult.winner, outcome: 'sub-game' };
  }
  return { winner: c1 > c2 ? 1 : 2, outcome: 'high-card' };
}

function playGame(
  d1: DeckRingBuffer,
  d2: DeckRingBuffer,
  recursive: boolean,
  useCompactKey: boolean,
  counter: GameCounter,
  records: RawTraceRecord[] | null,
): GameOutcome {
  const seen = recursive ? new Set<string>() : null;
  let rounds = 0;
  pushTrace(records, 0, d1, d2, null, null, 'initial', 0);

  while (!d1.isEmpty && !d2.isEmpty) {
    if (seen !== null) {
      const key = encodeStateKey(d1, d2, useCompactKey);
      if (seen.has(key)) {
        pushTrace(records, rounds, d1, d2, null, 1, 'loop-abort', counter.subGamesStarted);
        return { winner: 1, rounds, abortedByLoop: true };
      }
      seen.add(key);
    }
    rounds += 1;
    const c1 = d1.draw();
    const c2 = d2.draw();
    const round = resolveRound(c1, c2, d1, d2, recursive, useCompactKey, counter);
    if (round.winner === 1) {
      d1.push(c1);
      d1.push(c2);
    } else {
      d2.push(c2);
      d2.push(c1);
    }
    pushTrace(records, rounds, d1, d2, [c1, c2], round.winner, round.outcome, counter.subGamesStarted);
  }
  return { winner: d2.isEmpty ? 1 : 2, rounds, abortedByLoop: false };
}

/** Runs a full standard or recursive Crab Combat game and returns the final score summary. */
export function simulateCombat(decks: CombatDecks, recursive: boolean): CombatResult {
  const cap = decks.totalCards;
  const d1 = new DeckRingBuffer(cap, decks.player1);
  const d2 = new DeckRingBuffer(cap, decks.player2);
  const useCompactKey = decks.maxCard <= 0xffff;
  const counter: GameCounter = { subGamesStarted: 0 };
  const outcome = playGame(d1, d2, recursive, useCompactKey, counter, null);
  const winnerDeck = outcome.winner === 1 ? d1 : d2;
  return {
    winner: outcome.winner,
    score: scoreDeck(winnerDeck.toArray()),
    rounds: outcome.rounds,
    subGamesStarted: counter.subGamesStarted,
    abortedByLoop: outcome.abortedByLoop,
  };
}

/** Runs Crab Combat while recording bounded top-level trace frames for visualization. */
export function simulateCombatTrace(
  decks: CombatDecks,
  recursive: boolean,
  maxSteps: number,
): readonly CombatTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const cap = decks.totalCards;
  const d1 = new DeckRingBuffer(cap, decks.player1);
  const d2 = new DeckRingBuffer(cap, decks.player2);
  const useCompactKey = decks.maxCard <= 0xffff;
  const counter: GameCounter = { subGamesStarted: 0 };
  const records: RawTraceRecord[] = [];
  playGame(d1, d2, recursive, useCompactKey, counter, records);
  return sampleCombatTrace(records, limit);
}
