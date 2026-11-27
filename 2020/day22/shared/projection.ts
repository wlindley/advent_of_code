import type { PlayerId } from './model';
import type { CombatTraceFrame, RoundOutcome } from './trace';

export const MAX_VISIBLE_CARDS = 20;

const OUTCOME_LABELS: Record<RoundOutcome, string> = {
  initial: 'Initial Deal',
  'high-card': 'High Card',
  'sub-game': 'Sub-Game',
  'sub-game-shortcut': 'Pigeonhole Shortcut',
  'loop-abort': 'Loop Abort (P1)',
};

export interface ProjectedCard {
  readonly value: number;
  readonly positionFromBottom: number;
  readonly isNewlyWon: boolean;
}

export interface DeckProjection {
  readonly player: PlayerId;
  readonly totalCount: number;
  readonly score: number;
  readonly head: readonly ProjectedCard[];
  readonly tail: readonly ProjectedCard[];
  readonly hiddenCount: number;
  readonly isWinner: boolean;
}

export interface CombatArenaProjection {
  readonly round: number;
  readonly totalRounds: number;
  readonly outcome: RoundOutcome;
  readonly outcomeLabel: string;
  readonly played: readonly [number, number] | null;
  readonly roundWinner: PlayerId | null;
  readonly gameWinner: PlayerId | null;
  readonly winningScore: number | null;
  readonly subGamesStarted: number;
  readonly p1Share: number;
  readonly deck1: DeckProjection;
  readonly deck2: DeckProjection;
}

const EMPTY_CARDS: readonly ProjectedCard[] = Object.freeze([]);

function toProjectedCard(
  deck: readonly number[],
  index: number,
  newlyWonStart: number,
): ProjectedCard {
  return Object.freeze({
    value: deck[index]!,
    positionFromBottom: deck.length - index,
    isNewlyWon: index >= newlyWonStart,
  });
}

function projectDeck(
  player: PlayerId,
  deck: readonly number[],
  score: number,
  hasNewlyWon: boolean,
  isWinner: boolean,
  maxVisible: number,
): DeckProjection {
  const newlyWonStart = hasNewlyWon ? deck.length - 2 : deck.length;
  if (deck.length <= maxVisible) {
    const head = Object.freeze(deck.map((_, i) => toProjectedCard(deck, i, newlyWonStart)));
    return Object.freeze({
      player, totalCount: deck.length, score, head, tail: EMPTY_CARDS, hiddenCount: 0, isWinner,
    });
  }
  const headCount = Math.ceil(maxVisible / 2);
  const tailCount = maxVisible - headCount;
  const tailStart = deck.length - tailCount;
  const head = Array.from({ length: headCount }, (_, i) => toProjectedCard(deck, i, newlyWonStart));
  const tail = Array.from({ length: tailCount }, (_, i) => toProjectedCard(deck, tailStart + i, newlyWonStart));
  return Object.freeze({
    player,
    totalCount: deck.length,
    score,
    head: Object.freeze(head),
    tail: Object.freeze(tail),
    hiddenCount: deck.length - maxVisible,
    isWinner,
  });
}

/** Projects a CombatTraceFrame into windowed head+tail deck ribbons and momentum telemetry. */
export function projectCombatArena(frame: CombatTraceFrame, maxVisible: number): CombatArenaProjection {
  if (!Number.isInteger(maxVisible) || maxVisible < 4) {
    throw new RangeError(`maxVisible must be an integer >= 4, got ${maxVisible}`);
  }
  const p1WonCards = frame.roundWinner === 1 && frame.played !== null;
  const p2WonCards = frame.roundWinner === 2 && frame.played !== null;
  return Object.freeze({
    round: frame.round,
    totalRounds: frame.totalRounds,
    outcome: frame.outcome,
    outcomeLabel: OUTCOME_LABELS[frame.outcome],
    played: frame.played,
    roundWinner: frame.roundWinner,
    gameWinner: frame.gameWinner,
    winningScore: frame.winningScore,
    subGamesStarted: frame.subGamesStarted,
    p1Share: frame.p1Count / frame.totalCards,
    deck1: projectDeck(1, frame.deck1, frame.p1Score, p1WonCards, frame.gameWinner === 1, maxVisible),
    deck2: projectDeck(2, frame.deck2, frame.p2Score, p2WonCards, frame.gameWinner === 2, maxVisible),
  });
}
