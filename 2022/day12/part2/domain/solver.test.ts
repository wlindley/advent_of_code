import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { ANY_LOWEST_START_CONDITION, solver } from './index';

const OFFICIAL_EXAMPLE = [
  'Sabqponm',
  'abcryxxl',
  'accszExk',
  'acctuvwj',
  'abdefghi',
].join('\n');

describe('Day 12 Part 2 ANY_LOWEST_START_CONDITION', () => {
  it('is frozen, labeled Any lowest elevation (\'a\'), and matches only height 0', () => {
    expect(Object.isFrozen(ANY_LOWEST_START_CONDITION)).toBe(true);
    expect(ANY_LOWEST_START_CONDITION.label).toBe("Any lowest elevation ('a')");
    const alphabet = solver.parse('SabcdefghijklmnopqrstuvwxyzE');
    expect(ANY_LOWEST_START_CONDITION.matches(alphabet, 0)).toBe(true);
    expect(ANY_LOWEST_START_CONDITION.matches(alphabet, 1)).toBe(true);
    for (let i = 2; i < alphabet.size; i += 1) {
      expect(ANY_LOWEST_START_CONDITION.matches(alphabet, i)).toBe(false);
    }
    expect(() => ANY_LOWEST_START_CONDITION.matches(alphabet, -1)).toThrow(RangeError);
    expect(() => ANY_LOWEST_START_CONDITION.matches(alphabet, alphabet.size)).toThrow(RangeError);
  });
});

describe('Day 12 Part 2 solver', () => {
  it('is frozen and solves the official 5x8 example to 29', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    const map = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(map)).toBe(29);
  });

  it('produces trace with winningDistance 29, winningStartIndex (4, 0), and bounded steps', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace!(map);
    const expectedStart = map.indexOf(4, 0);
    expect(frames[0]!.winningDistance).toBe(29);
    expect(frames[0]!.winningStartIndex).toBe(expectedStart);
    expect(frames[28]!.winningStartReached).toBe(false);
    expect(frames[29]!.winningStartReached).toBe(true);
    expect(frames[frames.length - 1]!.isComplete).toBe(true);

    const sampled = solver.trace!(map, { maxSteps: 5 });
    expect(sampled.length).toBeLessThanOrEqual(5);
    expect(sampled[0]!.distance).toBe(0);
    expect(sampled[sampled.length - 1]!.isComplete).toBe(true);

    expect(() => solver.trace!(map, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace!(map, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => solver.trace!(map, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('runs through executeSolver with injected clock', () => {
    const fakeClock = { nowMs: () => 42 };
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(result.answer).toBe(29);
    expect(result.elapsedMs).toBe(0);
    expect(result.runtime).toBe('main-thread');
  });

  it('handles S as sole optimal start, unreachable pockets, and unreachable S with reachable a', () => {
    expect(solver.solve(solver.parse('SbcdefghijklmnopqrstuvwxyE'))).toBe(25);
    expect(solver.solve(solver.parse('acSbcdefghijklmnopqrstuvwxyE'))).toBe(25);
    expect(solver.solve(solver.parse('ScabcdefghijklmnopqrstuvwxyzE'))).toBe(26);
  });

  it('handles equidistant a ties and steep drop shortcuts', () => {
    const ties = [
      'zSzzzzzzzzzzzzzzzzzzzzzzzz',
      'zbcdefghijklmnopqrstuvwxyE',
      'zazzzzzzzzzzzzzzzzzzzzzzzz',
    ].join('\n');
    expect(solver.solve(solver.parse(ties))).toBe(25);

    const steepDrop = 'SbcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyE';
    expect(solver.solve(solver.parse(steepDrop))).toBe(25);
  });

  it('throws descriptive error when no height-0 cell can reach E and rejects invalid input', () => {
    expect(() => solver.solve(solver.parse('SE'))).toThrow(
      /No reachable start cell matching "Any lowest elevation \('a'\)"/,
    );
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('abc\ndef')).toThrow();
    expect(() => solver.parse('Sab\ncd')).toThrow();
    expect(() => solver.parse('S1E')).toThrow();
  });
});
