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

describe('2020 Day 22 Part 1 solver', () => {
  it('solves the official Crab Combat example to 306', () => {
    const result = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(result.answer).toBe(306);
  });

  it('bounds trace frames with omitted and explicit maxSteps', () => {
    const decks = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(decks);
    expect(full.length).toBe(30);
    expect(full[0]!.round).toBe(0);
    expect(full[29]!.winningScore).toBe(306);

    const bounded = solver.trace(decks, { maxSteps: 6 });
    expect(bounded.length).toBe(6);
    expect(bounded[0]!.round).toBe(0);
    expect(bounded[5]!.round).toBe(29);
  });

  it('rejects malformed inputs and invalid trace maxSteps', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('Player 1:\n1')).toThrow();
    expect(() => solver.trace(solver.parse(OFFICIAL_EXAMPLE), { maxSteps: 0 })).toThrow(RangeError);
  });
});
