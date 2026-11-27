import { describe, expect, it } from 'vitest';
import { simulateCombat, simulateCombatTrace } from './engine';
import { CombatDecks, parseCombatDecks, scoreDeck, type PlayerId } from './model';
import { sampleCombatTrace } from './trace';

const OFFICIAL_EXAMPLE = [
  'Player 1:',
  '9',
  '2',
  '6',
  '3',
  '1',
  '',
  'Player 2:',
  '5',
  '8',
  '4',
  '7',
  '10',
].join('\n');

function oracleRecursive(p1Init: readonly number[], p2Init: readonly number[]): { winner: PlayerId; score: number } {
  const d1 = [...p1Init];
  const d2 = [...p2Init];
  const seen = new Set<string>();
  while (d1.length > 0 && d2.length > 0) {
    const key = `${d1.join(',')}|${d2.join(',')}`;
    if (seen.has(key)) return { winner: 1, score: scoreDeck(d1) };
    seen.add(key);
    const c1 = d1.shift()!;
    const c2 = d2.shift()!;
    const winner =
      d1.length >= c1 && d2.length >= c2
        ? oracleRecursive(d1.slice(0, c1), d2.slice(0, c2)).winner
        : c1 > c2
          ? 1
          : 2;
    if (winner === 1) d1.push(c1, c2);
    else d2.push(c2, c1);
  }
  const winner: PlayerId = d2.length === 0 ? 1 : 2;
  return { winner, score: scoreDeck(winner === 1 ? d1 : d2) };
}

function seededShuffledDecks(seed: number, size: number): CombatDecks {
  let state = seed >>> 0;
  const cards = Array.from({ length: size * 2 }, (_, i) => i + 1);
  for (let i = cards.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = cards[i]!;
    cards[i] = cards[j]!;
    cards[j] = tmp;
  }
  return new CombatDecks(cards.slice(0, size), cards.slice(size));
}

describe('simulateCombat', () => {
  it('solves official Part 1 (306) and symmetric P1-win standard combat', () => {
    const decks = parseCombatDecks(OFFICIAL_EXAMPLE);
    const p2Win = simulateCombat(decks, false);
    expect(p2Win).toEqual({ winner: 2, score: 306, rounds: 29, subGamesStarted: 0, abortedByLoop: false });

    const p1Win = simulateCombat(new CombatDecks([10, 8], [3, 1]), false);
    expect(p1Win).toEqual({ winner: 1, score: 10 * 4 + 3 * 3 + 8 * 2 + 1, rounds: 2, subGamesStarted: 0, abortedByLoop: false });
  });

  it('solves official Part 2 (291) and handles infinite-loop abort (105)', () => {
    const example = simulateCombat(parseCombatDecks(OFFICIAL_EXAMPLE), true);
    expect(example.winner).toBe(2);
    expect(example.score).toBe(291);
    expect(example.rounds).toBe(17);
    expect(example.subGamesStarted).toBeGreaterThan(0);
    expect(example.abortedByLoop).toBe(false);

    const loopDecks = new CombatDecks([43, 19], [2, 29, 14]);
    const loopRes = simulateCombat(loopDecks, true);
    expect(loopRes).toEqual({ winner: 1, score: 105, rounds: 6, subGamesStarted: 0, abortedByLoop: true });
  });

  it('does not shortcut sub-games when max2 > max1 and supports large card fallback keys', () => {
    const subLoopDecks = new CombatDecks([2, 39, 29, 100], [3, 12, 53, 24, 200]);
    const res = simulateCombat(subLoopDecks, true);
    expect(res).toEqual({ ...res, ...oracleRecursive(subLoopDecks.player1, subLoopDecks.player2) });

    const largeCards = new CombatDecks([1, 70000, 4], [2, 5, 6]);
    const largeRes = simulateCombat(largeCards, true);
    expect(largeRes).toEqual({ ...largeRes, ...oracleRecursive(largeCards.player1, largeCards.player2) });
  });

  it('matches an unpruned plain-array recursive oracle across 20 seeded decks', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const decks = seededShuffledDecks(seed * 7919, 5);
      const actual = simulateCombat(decks, true);
      const expected = oracleRecursive(decks.player1, decks.player2);
      expect(actual.winner).toBe(expected.winner);
      expect(actual.score).toBe(expected.score);
    }
  });
});

describe('simulateCombatTrace & CombatTraceFrame', () => {
  it('captures initial, intermediate, and final frames with computed getters', () => {
    const frames = simulateCombatTrace(parseCombatDecks(OFFICIAL_EXAMPLE), true, 240);
    const first = frames[0]!;
    const mid = frames[1]!;
    const last = frames[frames.length - 1]!;

    expect(first.round).toBe(0);
    expect(first.totalRounds).toBe(17);
    expect(first.outcome).toBe('initial');
    expect(first.played).toBeNull();
    expect(first.isFinal).toBe(false);
    expect(first.gameWinner).toBeNull();
    expect(first.winningScore).toBeNull();
    expect(first.p1Count).toBe(5);
    expect(first.p2Count).toBe(5);
    expect(first.totalCards).toBe(10);
    expect(first.p1Score).toBe(scoreDeck([9, 2, 6, 3, 1]));
    expect(first.p2Score).toBe(scoreDeck([5, 8, 4, 7, 10]));

    expect(mid.round).toBe(1);
    expect(mid.played).toEqual([9, 5]);
    expect(mid.roundWinner).toBe(1);

    expect(last.isFinal).toBe(true);
    expect(last.gameWinner).toBe(2);
    expect(last.winningScore).toBe(291);
    expect(frames.some((f) => f.outcome === 'sub-game')).toBe(true);

    const shortcutFrames = simulateCombatTrace(new CombatDecks([1, 10], [2, 5, 6]), true, 50);
    expect(shortcutFrames.some((f) => f.outcome === 'sub-game-shortcut')).toBe(true);

    const p1WinFrames = simulateCombatTrace(new CombatDecks([10, 8], [3, 1]), false, 50);
    const p1Final = p1WinFrames[p1WinFrames.length - 1]!;
    expect(p1Final.isFinal).toBe(true);
    expect(p1Final.gameWinner).toBe(1);
    expect(p1Final.winningScore).toBe(p1Final.p1Score);

    const loopFrames = simulateCombatTrace(new CombatDecks([43, 19], [2, 29, 14]), true, 50);
    const loopFinal = loopFrames[loopFrames.length - 1]!;
    expect(loopFinal.outcome).toBe('loop-abort');
    expect(loopFinal.isFinal).toBe(true);
    expect(loopFinal.gameWinner).toBe(1);
    expect(loopFinal.winningScore).toBe(105);
  });

  it('bounds trace frames via sampleCombatTrace and rejects invalid maxSteps', () => {
    const decks = parseCombatDecks(OFFICIAL_EXAMPLE);
    const single = simulateCombatTrace(decks, false, 1);
    expect(single.length).toBe(1);
    expect(single[0]!.round).toBe(29);

    const sampled = simulateCombatTrace(decks, false, 5);
    expect(sampled.length).toBe(5);
    expect(sampled[0]!.round).toBe(0);
    expect(sampled[4]!.round).toBe(29);

    const all = simulateCombatTrace(decks, false, 100);
    expect(all.length).toBe(30);

    expect(sampleCombatTrace([], 5)).toEqual([]);
    expect(() => simulateCombatTrace(decks, false, 0)).toThrow(RangeError);
  });
});
