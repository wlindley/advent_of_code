import { describe, expect, it } from 'vitest';
import {
  ArcadeSolver,
  BALL_TRAIL_LIMIT,
  BLOCK_COUNT_POLICY,
  DEFAULT_MAX_TRACE_STEPS,
  FREE_PLAY_SCORE_POLICY,
  executeArcade,
  traceArcade,
} from './arcadeSolver';

const EXAMPLE_PROGRAM = '104,1,104,2,104,3,104,6,104,5,104,4,99';

const REACTIVE_BREAKOUT_PROGRAM = [
  1, 3, 3, 40, 1008, 40, 1600, 41, 1005, 41, 19,
  104, 2, 104, 1, 104, 2, 99, 0,
  104, 2, 104, 1, 104, 2, 104, 1, 104, 4, 104, 3, 104, 3, 104, 2, 104, 4,
  1105, 1, 42, 0, 0,
  3, 40, 1, 40, 40, 41, 104, 2, 104, 4, 104, 3,
  3, 40, 104, 3, 104, 4, 104, 3, 104, 2, 104, 1, 104, 0, 104, -1, 104, 0, 104, 100, 99,
].join(',');

function buildLongBallDrawProgram(moves: number): string {
  const ops: number[] = [104, 0, 104, 0, 104, 2];
  for (let i = 0; i < moves; i += 1) {
    ops.push(104, i + 1, 104, 1, 104, 4);
  }
  ops.push(99);
  return ops.join(',');
}

describe('arcadeSolver', () => {
  it('traces empty halting program as a single empty draw frame', () => {
    const solver = new ArcadeSolver(BLOCK_COUNT_POLICY);
    const program = solver.parse('99');
    expect(solver.solve(program)).toBe(0);

    const frames = solver.trace(program);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.phase).toBe('draw');
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[0]!.totalSteps).toBe(0);
    expect(frames[0]!.tiles.size).toBe(0);
    expect(frames[0]!.ballTrail).toEqual([]);
    expect(frames[0]!.lastTilt).toBeNull();
  });

  it('solves and traces Part 1 draw phase with sampling and ballTrail limit', () => {
    const solver = new ArcadeSolver(BLOCK_COUNT_POLICY);
    expect(BLOCK_COUNT_POLICY.showScoreBanner).toBe(false);
    expect(BLOCK_COUNT_POLICY.memoryPatch).toBeNull();
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);

    const example = solver.parse(EXAMPLE_PROGRAM);
    expect(solver.solve(example)).toBe(0);
    const full = solver.trace(example);
    expect(full).toHaveLength(3);
    expect(full[2]!.paddleX).toBe(1);
    expect(full[2]!.ballX).toBe(6);
    expect(full[2]!.ballY).toBe(5);
    expect(BLOCK_COUNT_POLICY.formatFrameAnswer(full[2]!)).toBe('0');

    const sampled = solver.trace(example, { maxSteps: 2 });
    expect(sampled.map((f) => f.stepIndex)).toEqual([0, 2]);

    const longProgram = solver.parse(buildLongBallDrawProgram(25));
    const longFrames = traceArcade(longProgram, BLOCK_COUNT_POLICY, 6);
    expect(longFrames).toHaveLength(6);
    expect(longFrames[5]!.ballTrail.length).toBe(BALL_TRAIL_LIMIT);
    expect(BLOCK_COUNT_POLICY.formatFrameAnswer(longFrames[5]!)).toBe('1');
  });

  it('solves and traces Part 2 play phase using FREE_PLAY_SCORE_POLICY', () => {
    const solver = new ArcadeSolver(FREE_PLAY_SCORE_POLICY);
    expect(FREE_PLAY_SCORE_POLICY.showScoreBanner).toBe(true);
    expect(FREE_PLAY_SCORE_POLICY.memoryPatch).toEqual({ address: 0n, value: 2n });

    const program = solver.parse(REACTIVE_BREAKOUT_PROGRAM);
    expect(solver.solve(program)).toBe(100);
    const report = executeArcade(program, FREE_PLAY_SCORE_POLICY, { maxVmSteps: 10_000, maxInputTurns: 10 });
    expect(report.score).toBe(100);

    const frames = solver.trace(program);
    expect(frames).toHaveLength(3);
    expect(frames.map((f) => f.phase)).toEqual(['play', 'play', 'play']);
    expect(frames[0]!.lastTilt).toBeNull();
    expect(frames[0]!.inputTurn).toBe(0);
    expect(frames[1]!.lastTilt).toBe(1);
    expect(frames[2]!.lastTilt).toBe(1);
    expect(frames[2]!.totalInputTurns).toBe(2);
    expect(FREE_PLAY_SCORE_POLICY.formatFrameAnswer(frames[2]!)).toBe('100');

    const sampled = solver.trace(program, { maxSteps: 2 });
    expect(sampled.map((f) => f.stepIndex)).toEqual([0, 2]);
  });

  it('rejects invalid maxSteps trace option', () => {
    const solver = new ArcadeSolver(BLOCK_COUNT_POLICY);
    const program = solver.parse('99');
    expect(() => solver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
  });
});
