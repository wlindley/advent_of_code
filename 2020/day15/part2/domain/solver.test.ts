import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  MAX_TRACE_TURN,
  PART2_TARGET_TURN,
  playMemoryGame,
  StartingSequence,
} from '../../shared';
import { solver } from './solver';

function mapMemoryOracle(seeds: readonly number[], targetTurn: number): number {
  const lastSeen = new Map<number, number>();
  let spoken = 0;
  for (let turn = 1; turn <= targetTurn; turn += 1) {
    let next: number;
    if (turn <= seeds.length) {
      next = seeds[turn - 1]!;
    } else {
      const prev = lastSeen.get(spoken);
      next = prev === undefined ? 0 : turn - 1 - prev;
    }
    if (turn > 1) lastSeen.set(spoken, turn - 1);
    spoken = next;
  }
  return spoken;
}

const DIFFERENTIAL_SEEDS: readonly (readonly number[])[] = [
  [0, 3, 6],
  [1, 3, 2],
  [2, 1, 3],
  [1, 2, 3],
  [2, 3, 1],
  [3, 2, 1],
  [3, 1, 2],
  [0],
  [3, 3],
  [50_000, 1, 50_000],
];

const DIFFERENTIAL_HORIZONS = [50, 500, 2020, 5000] as const;

describe('2020 Day 15 Part 2 solver', () => {
  it('targets turn 30_000_000, caps traceHorizon, is frozen, and solves 0,3,6', { timeout: 15_000 }, () => {
    expect(solver.targetTurn).toBe(PART2_TARGET_TURN);
    expect(solver.traceHorizon).toBe(MAX_TRACE_TURN);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.solve(solver.parse('0,3,6'))).toBe(175594);
  });

  it('produces bounded trace frames capped at MAX_TRACE_TURN', () => {
    const seq = solver.parse('0,3,6');
    const frames = solver.trace(seq);
    expect(frames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(frames[0]!.turn).toBe(1);
    const last = frames[frames.length - 1]!;
    expect(last.turn).toBe(MAX_TRACE_TURN);
    expect(last.isFinal).toBe(true);
    expect(last.isHorizonTruncated).toBe(true);
    expect(last.spoken).toBe(playMemoryGame(seq, MAX_TRACE_TURN));
    for (let i = 1; i < frames.length; i += 1) {
      expect(frames[i]!.turn).toBeGreaterThan(frames[i - 1]!.turn);
    }

    const capped = solver.trace(seq, { maxSteps: 12 });
    expect(capped).toHaveLength(12);
    expect(capped[11]!.turn).toBe(MAX_TRACE_TURN);
  });

  it('matches independent Store-Previous-Turn Map oracle across seeds and horizons', () => {
    for (const seeds of DIFFERENTIAL_SEEDS) {
      const seq = new StartingSequence(seeds);
      for (const horizon of DIFFERENTIAL_HORIZONS) {
        expect(playMemoryGame(seq, horizon)).toBe(mapMemoryOracle(seeds, horizon));
      }
    }
  });

  it('rejects empty, negative, and non-numeric inputs and non-positive maxSteps', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('0,-3,6')).toThrow();
    expect(() => solver.parse('0,abc,6')).toThrow();
    expect(() => solver.trace(solver.parse('0,3,6'), { maxSteps: 0 })).toThrow(RangeError);
  });
});
