import { describe, expect, it } from 'vitest';
import { MAX_VISIBLE_CARDS, projectCombatArena } from './projection';
import { CombatTraceFrame, type RoundOutcome } from './trace';

function makeFrame(
  deck1: readonly number[],
  deck2: readonly number[],
  played: readonly [number, number] | null,
  roundWinner: 1 | 2 | null,
  outcome: RoundOutcome,
  round = 1,
  totalRounds = 10,
  subGamesStarted = 0,
): CombatTraceFrame {
  return new CombatTraceFrame(
    { round, deck1, deck2, played, roundWinner, outcome, subGamesStarted },
    totalRounds,
  );
}

describe('projectCombatArena', () => {
  it('projects unwindowed decks, newly-won highlights, and all 5 outcome labels', () => {
    const initial = makeFrame([9, 2, 6], [5, 8, 4], null, null, 'initial', 0, 5, 0);
    const p0 = projectCombatArena(initial, MAX_VISIBLE_CARDS);
    expect(p0.outcomeLabel).toBe('Initial Deal');
    expect(p0.p1Share).toBe(0.5);
    expect(p0.deck1.hiddenCount).toBe(0);
    expect(p0.deck1.tail).toEqual([]);
    expect(p0.deck1.head.every((c) => !c.isNewlyWon)).toBe(true);
    expect(p0.deck1.head[0]).toEqual({ value: 9, positionFromBottom: 3, isNewlyWon: false });

    const p1Won = makeFrame([2, 6, 9, 5], [8, 4], [9, 5], 1, 'high-card', 1, 5, 0);
    const p1 = projectCombatArena(p1Won, MAX_VISIBLE_CARDS);
    expect(p1.outcomeLabel).toBe('High Card');
    expect(p1.deck1.head.map((c) => c.isNewlyWon)).toEqual([false, false, true, true]);
    expect(p1.deck2.head.every((c) => !c.isNewlyWon)).toBe(true);

    const p2Won = makeFrame([6], [4, 9, 5, 8, 2], [2, 8], 2, 'sub-game', 2, 5, 1);
    const p2 = projectCombatArena(p2Won, MAX_VISIBLE_CARDS);
    expect(p2.outcomeLabel).toBe('Sub-Game');
    expect(p2.deck2.head.map((c) => c.isNewlyWon)).toEqual([false, false, false, true, true]);

    const shortcut = makeFrame([9, 5, 6, 4], [8, 2], [6, 4], 1, 'sub-game-shortcut', 3, 5, 2);
    expect(projectCombatArena(shortcut, MAX_VISIBLE_CARDS).outcomeLabel).toBe('Pigeonhole Shortcut');

    const loopAbort = makeFrame([43, 19], [2, 29, 14], null, 1, 'loop-abort', 6, 6, 0);
    const pLoop = projectCombatArena(loopAbort, MAX_VISIBLE_CARDS);
    expect(pLoop.outcomeLabel).toBe('Loop Abort (P1)');
    expect(pLoop.deck1.isWinner).toBe(true);
    expect(pLoop.deck2.isWinner).toBe(false);
    expect(pLoop.deck1.head.every((c) => !c.isNewlyWon)).toBe(true);
  });

  it('windows oversized decks into head + tail preserving newly-won bottom cards', () => {
    const bigDeck1 = Array.from({ length: 12 }, (_, i) => i + 1);
    const bigDeck2 = Array.from({ length: 6 }, (_, i) => i + 20);
    const frame = makeFrame(bigDeck1, bigDeck2, [11, 12], 1, 'high-card', 5, 20, 0);
    const proj = projectCombatArena(frame, 6);

    expect(proj.deck1.head.map((c) => c.value)).toEqual([1, 2, 3]);
    expect(proj.deck1.tail.map((c) => c.value)).toEqual([10, 11, 12]);
    expect(proj.deck1.tail.map((c) => c.isNewlyWon)).toEqual([false, true, true]);
    expect(proj.deck1.hiddenCount).toBe(6);

    expect(proj.deck2.head.length).toBe(6);
    expect(proj.deck2.tail).toEqual([]);
    expect(proj.deck2.hiddenCount).toBe(0);
  });

  it('rejects invalid maxVisible thresholds below 4 or non-integers', () => {
    const frame = makeFrame([1], [2], null, null, 'initial', 0, 1, 0);
    expect(() => projectCombatArena(frame, 3)).toThrow(RangeError);
    expect(() => projectCombatArena(frame, 4.5)).toThrow(RangeError);
  });
});
