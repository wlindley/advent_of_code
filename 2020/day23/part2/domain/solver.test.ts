import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { LOCAL_WINDOW_CUPS, MILLION_CUP_COUNT, MILLION_MOVES } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = '389125467';

describe('2020 Day 23 Part 2 solver', () => {
  it('solves the official 1M-cup Crab Cups example to 149245887792n', { timeout: 20_000 }, () => {
    expect(Object.isFrozen(solver)).toBe(true);
    const result = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(result.answer).toBe(149245887792n);
  });

  it('captures a bounded ribbon-mode trace across 10M moves', { timeout: 20_000 }, () => {
    const frames = solver.trace(solver.parse(OFFICIAL_EXAMPLE), { maxSteps: 6 });
    expect(frames).toHaveLength(6);

    const start = frames[0]!;
    expect(start.move).toBe(0);
    expect(start.lastMove).toBeNull();
    expect(start.cupCount).toBe(MILLION_CUP_COUNT);
    expect(start.totalMoves).toBe(MILLION_MOVES);
    expect(start.isFullRing).toBe(false);
    expect(start.labelsAfterOne).toBeNull();
    expect(start.windowFromOne).toHaveLength(LOCAL_WINDOW_CUPS);
    expect(start.windowFromCurrent).toHaveLength(LOCAL_WINDOW_CUPS);
    expect(start.isFinal).toBe(false);

    for (let i = 1; i < frames.length; i += 1) {
      expect(frames[i]!.move).toBeGreaterThan(frames[i - 1]!.move);
    }

    const end = frames[frames.length - 1]!;
    expect(end.move).toBe(MILLION_MOVES);
    expect(end.isFinal).toBe(true);
    expect(end.firstAfterOne).toBe(934001);
    expect(end.secondAfterOne).toBe(159792);
    expect(end.productAfterOne).toBe(149245887792n);
  });

  it('rejects malformed inputs and invalid trace maxSteps', () => {
    for (const bad of ['', '123', '1234a', '11234', '01234']) {
      expect(() => solver.parse(bad)).toThrow();
    }
    const spec = solver.parse(OFFICIAL_EXAMPLE);
    for (const badSteps of [0, -1, 1.5]) {
      expect(() => solver.trace(spec, { maxSteps: badSteps })).toThrow(RangeError);
    }
  });
});
