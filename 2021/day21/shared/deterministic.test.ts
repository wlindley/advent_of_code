import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DETERMINISTIC_TARGET,
  DEFAULT_MAX_TRACE_STEPS,
  solveDeterministicGame,
  traceDeterministicGame,
} from './deterministic';
import { BOARD_SPACES, DeterministicTurnFrame, DiracDiceInput, type PlayerId } from './types';

function oracleDeterministic(p1Start: number, p2Start: number, target: number): number {
  const buildCycle = (start: number, player: PlayerId): readonly number[] => {
    const prefix = [0];
    let pos = start;
    let sum = 0;
    for (let k = 0; k < 10; k += 1) {
      const roll = (((-(2 * k + player) - 3) % 10) + 10) % 10;
      pos = ((pos - 1 + roll) % BOARD_SPACES) + 1;
      sum += pos;
      prefix.push(sum);
    }
    return prefix;
  };
  const winTurns = (prefix: readonly number[]): number => {
    const cycle = prefix[10]!;
    const full = Math.floor((target - 1) / cycle);
    const rem = target - full * cycle;
    const j = prefix.findIndex((score) => score >= rem);
    return full * 10 + j;
  };
  const scoreAt = (prefix: readonly number[], turns: number): number =>
    Math.floor(turns / 10) * prefix[10]! + prefix[turns % 10]!;

  const p1Prefix = buildCycle(p1Start, 1);
  const p2Prefix = buildCycle(p2Start, 2);
  const p1Need = winTurns(p1Prefix);
  const p2Need = winTurns(p2Prefix);
  const p1Global = 2 * p1Need - 1;
  const p2Global = 2 * p2Need;
  if (p1Global < p2Global) {
    return scoreAt(p2Prefix, p1Need - 1) * (3 * p1Global);
  }
  return scoreAt(p1Prefix, p2Need) * (3 * p2Global);
}

describe('deterministic Dirac Dice', () => {
  it('solves the official (4, 8) example to 739785', () => {
    const input = new DiracDiceInput(4, 8);
    expect(solveDeterministicGame(input, DEFAULT_DETERMINISTIC_TARGET)).toBe(739785);
  });

  it('matches an independent O(1) period-10 oracle across all 100 starting pairs', () => {
    for (let p1 = 1; p1 <= 10; p1 += 1) {
      for (let p2 = 1; p2 <= 10; p2 += 1) {
        const input = new DiracDiceInput(p1, p2);
        expect(solveDeterministicGame(input, 1000)).toBe(oracleDeterministic(p1, p2, 1000));
      }
    }
  });

  it('handles targetScore = 1 and rejects invalid targetScore values', () => {
    const input = new DiracDiceInput(4, 8);
    expect(solveDeterministicGame(input, 1)).toBe(0);
    expect(() => solveDeterministicGame(input, 0)).toThrow(RangeError);
    expect(() => solveDeterministicGame(input, -3)).toThrow(RangeError);
    expect(() => solveDeterministicGame(input, 1.5)).toThrow(RangeError);
  });

  it('traces full (4, 8) game including turn 0, die wraparound [100,1,2], and turn 331 win', () => {
    const frames = traceDeterministicGame(new DiracDiceInput(4, 8), 1000, { maxSteps: 500 });
    expect(frames).toHaveLength(332);
    const start = frames[0]!;
    expect(start).toBeInstanceOf(DeterministicTurnFrame);
    expect(start.turn).toBe(0);
    expect(start.activePlayer).toBeNull();
    expect(start.rolls).toBeNull();
    expect(start.rollCount).toBe(0);
    expect(start.rollSum).toBe(0);
    expect(start.losingScore).toBe(0);
    expect(start.product).toBe(0);

    const turn1 = frames[1]!;
    expect(turn1.activePlayer).toBe(1);
    expect(turn1.rolls).toEqual([1, 2, 3]);
    expect(turn1.rollSum).toBe(6);
    expect(turn1.losingScore).toBe(0);

    expect(frames[34]!.rolls).toEqual([100, 1, 2]);

    const final = frames[331]!;
    expect(final.turn).toBe(331);
    expect(final.winner).toBe(1);
    expect(final.p1Score).toBe(1000);
    expect(final.p2Score).toBe(745);
    expect(final.rollCount).toBe(993);
    expect(final.losingScore).toBe(745);
    expect(final.product).toBe(739785);
  });

  it('covers P2 win trace and losingScore/product getters', () => {
    const frames = traceDeterministicGame(new DiracDiceInput(1, 10), 15, { maxSteps: 50 });
    const final = frames[frames.length - 1]!;
    expect(final.turn).toBe(6);
    expect(final.winner).toBe(2);
    expect(final.p2Score).toBe(22);
    expect(final.p1Score).toBe(11);
    expect(final.losingScore).toBe(11);
    expect(final.rollCount).toBe(18);
    expect(final.product).toBe(198);
  });

  it('respects omitted, single-step, sampled, and invalid trace options', () => {
    const input = new DiracDiceInput(4, 8);
    const defaultTrace = traceDeterministicGame(input, 1000);
    expect(defaultTrace).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(defaultTrace[0]!.turn).toBe(0);
    expect(defaultTrace[defaultTrace.length - 1]!.turn).toBe(331);

    const one = traceDeterministicGame(input, 1000, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.turn).toBe(331);

    const five = traceDeterministicGame(input, 1000, { maxSteps: 5 });
    expect(five).toHaveLength(5);
    expect(five[0]!.turn).toBe(0);
    expect(five[4]!.turn).toBe(331);

    expect(() => traceDeterministicGame(input, 1000, { maxSteps: 0 })).toThrow(RangeError);
  });
});
