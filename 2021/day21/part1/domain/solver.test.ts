import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, DeterministicTurnFrame, DiracDiceInput } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  'Player 1 starting position: 4',
  'Player 2 starting position: 8',
].join('\n');

describe('2021 Day 21 Part 1 solver', () => {
  it('parses and solves the official example to 739785', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(parsed).toBeInstanceOf(DiracDiceInput);
    expect(solver.solve(parsed)).toBe(739785);

    const exec = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(exec.answer).toBe(739785);
  });

  it('traces the official game with omitted and explicit maxSteps', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    const defaultFrames = solver.trace!(parsed);
    expect(defaultFrames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(defaultFrames[0]).toBeInstanceOf(DeterministicTurnFrame);
    expect(defaultFrames[0]!.turn).toBe(0);
    expect(defaultFrames[defaultFrames.length - 1]!.product).toBe(739785);

    const smallFrames = solver.trace!(parsed, { maxSteps: 6 });
    expect(smallFrames).toHaveLength(6);
    expect(smallFrames[0]!.turn).toBe(0);
    expect(smallFrames[5]!.turn).toBe(331);
    expect(smallFrames[5]!.winner).toBe(1);
  });

  it('rejects invalid puzzle input and invalid trace options', () => {
    expect(() => solver.parse('Player 1 starting position: 4')).toThrow();
    expect(() =>
      solver.parse('Player 1 starting position: 11\nPlayer 2 starting position: 8'),
    ).toThrow(RangeError);
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(() => solver.trace!(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });
});
