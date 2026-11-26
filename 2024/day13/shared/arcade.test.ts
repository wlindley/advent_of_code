import { describe, expect, it } from 'vitest';
import {
  ClawConfig,
  ClawMachine,
  ClawTraceFrame,
  createClawContraptionSolver,
  DEFAULT_MAX_TRACE_STEPS,
  evaluateClawArcade,
  traceClawArcade,
  Vector2D,
} from './index';

const CONFIG = new ClawConfig(0n, 100n);
const SAMPLE_TEXT = [
  'Button A: X+94, Y+34',
  'Button B: X+22, Y+67',
  'Prize: X=8400, Y=5400',
  '',
  'Button A: X+26, Y+66',
  'Button B: X+67, Y+21',
  'Prize: X=12748, Y=12176',
  '',
  'Button A: X+17, Y+86',
  'Button B: X+84, Y+37',
  'Prize: X=7870, Y=6450',
  '',
  'Button A: X+69, Y+23',
  'Button B: X+27, Y+71',
  'Prize: X=18641, Y=10279',
].join('\n');

describe('evaluateClawArcade and ClawTraceFrame', () => {
  it('sums minimum tokens across winnable machines and exposes frame tokens dynamically', () => {
    const solver = createClawContraptionSolver(CONFIG);
    const machines = solver.parse(SAMPLE_TEXT);
    expect(evaluateClawArcade(machines, CONFIG)).toBe(480n);
    expect(solver.solve(machines)).toBe(480n);

    const frames = solver.trace!(machines);
    expect(frames).toHaveLength(4);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames[0]).toBeInstanceOf(ClawTraceFrame);
    expect(frames[0]!.tokens).toBe(280n);
    expect(frames[1]!.tokens).toBe(0n);
    expect(frames[2]!.cumulativeWins).toBe(2);
    expect(frames[3]!.cumulativeTokens).toBe(480n);
  });
});

describe('traceClawArcade sampling', () => {
  it('bounds trace frames with default limit, supports maxSteps=1, and rejects invalid maxSteps', () => {
    const m = new ClawMachine(new Vector2D(1n, 2n), new Vector2D(2n, 1n), new Vector2D(3n, 3n));
    const many = Array.from({ length: DEFAULT_MAX_TRACE_STEPS + 25 }, () => m);

    const bounded = traceClawArcade(many, CONFIG);
    expect(bounded).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(bounded[0]!.machineIndex).toBe(0);
    expect(bounded[bounded.length - 1]!.machineIndex).toBe(many.length - 1);
    expect(bounded[bounded.length - 1]!.cumulativeWins).toBe(many.length);

    const single = traceClawArcade(many, CONFIG, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.machineIndex).toBe(many.length - 1);

    expect(() => traceClawArcade(many, CONFIG, { maxSteps: 0 })).toThrow(RangeError);
  });
});
