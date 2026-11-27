import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

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

const INFINITE_LOOP_FIXTURE = ['Player 1:', '43', '19', '', 'Player 2:', '2', '29', '14'].join('\n');
const P2_SUBGAME_FIXTURE = ['Player 1:', '2', '3', '4', '', 'Player 2:', '1', '6', '5'].join('\n');
const P1_SHORTCUT_FIXTURE = ['Player 1:', '1', '10', '9', '', 'Player 2:', '2', '5', '6'].join('\n');

describe('2020 Day 22 Part 2 solver', () => {
  it('binds recursive-combat policy and solves the official example to 291', () => {
    expect(solver.policy.id).toBe('recursive-combat');
    expect(solver.policy.recursive).toBe(true);

    const result = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(result.answer).toBe(291);

    const frames = solver.trace(solver.parse(OFFICIAL_EXAMPLE));
    expect(frames).toHaveLength(18);
    expect(frames[9]!.outcome).toBe('sub-game');

    const last = frames[17]!;
    expect(last.subGamesStarted).toBe(4);
    expect(last.isFinal).toBe(true);
    expect(last.gameWinner).toBe(2);
    expect(last.winningScore).toBe(291);
  });

  it('aborts infinite-loop fixtures in favor of Player 1 with score 105', () => {
    expect(executeSolver(solver, INFINITE_LOOP_FIXTURE).answer).toBe(105);

    const frames = solver.trace(solver.parse(INFINITE_LOOP_FIXTURE));
    expect(frames).toHaveLength(8);
    expect(frames[7]).toMatchObject({
      round: 6,
      totalRounds: 6,
      outcome: 'loop-abort',
      played: null,
      roundWinner: 1,
      isFinal: true,
      gameWinner: 1,
      winningScore: 105,
    });
  });

  it('awards round to Player 2 when Player 2 wins a sub-game with a smaller card', () => {
    expect(executeSolver(solver, P2_SUBGAME_FIXTURE).answer).toBe(63);

    const frames = solver.trace(solver.parse(P2_SUBGAME_FIXTURE));
    expect(frames[1]).toMatchObject({
      played: [2, 1],
      roundWinner: 2,
      outcome: 'sub-game',
      deck2: [6, 5, 1, 2],
    });
  });

  it('awards round to Player 1 via sub-game pigeonhole shortcut with a smaller card', () => {
    expect(executeSolver(solver, P1_SHORTCUT_FIXTURE).answer).toBe(95);

    const frames = solver.trace(solver.parse(P1_SHORTCUT_FIXTURE));
    expect(frames[1]).toMatchObject({
      played: [1, 2],
      roundWinner: 1,
      outcome: 'sub-game-shortcut',
      deck1: [10, 9, 1, 2],
    });
  });

  it('caps sampled trace frames according to maxSteps', () => {
    const decks = solver.parse(OFFICIAL_EXAMPLE);
    const six = solver.trace(decks, { maxSteps: 6 });
    expect(six).toHaveLength(6);
    expect(six[0]!.round).toBe(0);
    expect(six[5]!.round).toBe(17);

    const one = solver.trace(decks, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.round).toBe(17);
  });

  it('rejects invalid inputs and invalid trace maxSteps separately', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('Player 1:\n1')).toThrow();
    expect(() => solver.parse('Player 1:\n2\n1\n3\n\nPlayer 2:\n1\n4')).toThrow();

    const decks = solver.parse(OFFICIAL_EXAMPLE);
    expect(() => solver.trace(decks, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(decks, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
