import { describe, expect, it } from 'vitest';
import {
  DENSE_TRACE_PREFIX,
  MAX_TRACE_TURN,
  PART1_TARGET_TURN,
  PART2_TARGET_TURN,
  RECENT_WINDOW_SIZE,
  StartingSequence,
} from './model';
import { buildTraceTurns, MemoryGameSolver, MemoryGameTraceFrame } from './solver';

describe('buildTraceTurns', () => {
  it('validates horizon and maxSteps bounds', () => {
    expect(() => buildTraceTurns(0, 10)).toThrow(RangeError);
    expect(() => buildTraceTurns(1.5, 10)).toThrow(RangeError);
    expect(() => buildTraceTurns(10, 0)).toThrow(RangeError);
  });

  it('returns dense turns when horizon <= maxSteps and single final turn when maxSteps === 1', () => {
    expect(buildTraceTurns(5, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(buildTraceTurns(5, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildTraceTurns(100, 1)).toEqual([100]);
  });

  it('preserves dense prefix up to DENSE_TRACE_PREFIX and samples tail up to horizon', () => {
    const smallLimit = buildTraceTurns(50, 5);
    expect(smallLimit).toHaveLength(5);
    expect(smallLimit.slice(0, 4)).toEqual([1, 2, 3, 4]);
    expect(smallLimit[4]).toBe(50);

    const sampled = buildTraceTurns(200, 24);
    expect(sampled).toHaveLength(24);
    expect(sampled.slice(0, DENSE_TRACE_PREFIX)).toEqual(
      Array.from({ length: DENSE_TRACE_PREFIX }, (_, i) => i + 1),
    );
    expect(sampled[16]).toBe(17);
    expect(sampled[23]).toBe(200);
    for (let i = 1; i < sampled.length; i += 1) {
      expect(sampled[i]!).toBeGreaterThan(sampled[i - 1]!);
    }
  });
});

describe('MemoryGameTraceFrame', () => {
  it('computes dynamic getters and handles empty recentTurns cleanly', () => {
    const emptyFrame = new MemoryGameTraceFrame({
      turn: 1,
      targetTurn: 10,
      traceHorizon: 10,
      spoken: 0,
      origin: 'seed',
      considered: null,
      previousTurn: null,
      distinctCount: 1,
      zeroCount: 1,
      maxSpoken: 0,
      recentTurns: [],
    });

    expect(Object.isFrozen(emptyFrame)).toBe(true);
    expect(Object.isFrozen(emptyFrame.recentTurns)).toBe(true);
    expect(emptyFrame.isFinal).toBe(false);
    expect(emptyFrame.isHorizonTruncated).toBe(false);
    expect(emptyFrame.age).toBeNull();
    expect(emptyFrame.seedCount).toBe(0);
    expect(emptyFrame.repeatRatio).toBe(0);
  });
});

describe('MemoryGameSolver', () => {
  it('validates targetTurn and exposes parse, solve, and traceHorizon', () => {
    expect(() => new MemoryGameSolver(0)).toThrow(RangeError);
    const solver = new MemoryGameSolver(PART1_TARGET_TURN);
    expect(solver.targetTurn).toBe(2020);
    expect(solver.traceHorizon).toBe(2020);
    expect(Object.isFrozen(solver)).toBe(true);

    const seq = solver.parse('0,3,6');
    expect(seq.values).toEqual([0, 3, 6]);
    expect(solver.solve(seq)).toBe(436);
  });

  it('maintains Commit-on-Speak invariant for duplicate seeds 3,3', () => {
    const solver = new MemoryGameSolver(6);
    const frames = solver.trace(solver.parse('3,3'));
    expect(frames).toHaveLength(6);

    const t1 = frames[0]!;
    expect(t1.spoken).toBe(3);
    expect(t1.origin).toBe('seed');
    expect(t1.distinctCount).toBe(1);
    expect(t1.seedCount).toBe(1);

    const t2 = frames[1]!;
    expect(t2.spoken).toBe(3);
    expect(t2.origin).toBe('seed');
    expect(t2.considered).toBeNull();
    expect(t2.previousTurn).toBeNull();
    expect(t2.distinctCount).toBe(1);
    expect(t2.seedCount).toBe(2);

    const t3 = frames[2]!;
    expect(t3.spoken).toBe(1);
    expect(t3.origin).toBe('repeat');
    expect(t3.considered).toBe(3);
    expect(t3.previousTurn).toBe(1);
    expect(t3.age).toBe(1);
    expect(t3.distinctCount).toBe(2);
    expect(t3.repeatRatio).toBeCloseTo(1 / 3);

    const t4 = frames[3]!;
    expect(t4.spoken).toBe(0);
    expect(t4.origin).toBe('novel');
    expect(t4.considered).toBe(1);
    expect(t4.previousTurn).toBeNull();
    expect(t4.zeroCount).toBe(1);
    expect(t4.distinctCount).toBe(3);
  });

  it('caps recentTurns window to RECENT_WINDOW_SIZE and enforces traceHorizon for Part 2', () => {
    const part1 = new MemoryGameSolver(PART1_TARGET_TURN);
    const defaultFrames = part1.trace(part1.parse('0,3,6'));
    expect(defaultFrames).toHaveLength(200);
    const finalP1 = defaultFrames[defaultFrames.length - 1]!;
    expect(finalP1.turn).toBe(2020);
    expect(finalP1.spoken).toBe(436);
    expect(finalP1.isFinal).toBe(true);
    expect(finalP1.isHorizonTruncated).toBe(false);
    expect(finalP1.recentTurns).toHaveLength(RECENT_WINDOW_SIZE);
    expect(finalP1.seedCount).toBe(0);

    const part2 = new MemoryGameSolver(PART2_TARGET_TURN);
    expect(part2.traceHorizon).toBe(MAX_TRACE_TURN);
    const seq = new StartingSequence([0, 3, 6]);
    const frames = part2.trace(seq, { maxSteps: 20 });
    expect(frames).toHaveLength(20);
    const last = frames[frames.length - 1]!;
    expect(last.turn).toBe(MAX_TRACE_TURN);
    expect(last.isFinal).toBe(true);
    expect(last.isHorizonTruncated).toBe(true);
  });

  it('handles targetTurn smaller than starting sequence length in trace', () => {
    const shortSolver = new MemoryGameSolver(2);
    const frames = shortSolver.trace(shortSolver.parse('0,3,6'));
    expect(frames.map((f) => f.spoken)).toEqual([0, 3]);
    expect(frames[1]!.isFinal).toBe(true);
  });
});
