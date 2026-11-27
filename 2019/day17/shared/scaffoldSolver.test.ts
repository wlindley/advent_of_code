import { describe, expect, it } from 'vitest';
import {
  ALIGNMENT_PARAMETERS_POLICY,
  DEFAULT_MAX_TRACE_STEPS,
  DUST_COLLECTION_POLICY,
  ScaffoldSolver,
  executeScaffold,
  traceScaffold,
} from './scaffoldSolver';

const DUAL_TAPE = [
  1, 32, 33, 34,
  1008, 34, 12, 35,
  1005, 35, 25,
  4, 37,
  1001, 12, 1, 12,
  1008, 12, 49, 36,
  1006, 36, 11,
  99,
  3, 34,
  104, 79,
  104, 54321,
  99,
  3, 4, 0, 0, 0,
  46, 35, 46, 10,
  35, 35, 35, 10,
  94, 35, 46, 10,
].join(',');

describe('ScaffoldSolver', () => {
  it('solves and traces Part 1 alignment parameters with progressive scan reveal', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const solver = new ScaffoldSolver(ALIGNMENT_PARAMETERS_POLICY);
    const program = solver.parse(DUAL_TAPE);

    expect(solver.solve(program)).toBe(1n);
    expect(executeScaffold(program, ALIGNMENT_PARAMETERS_POLICY)).toBe(1n);

    const frames = solver.trace(program);
    expect(frames).toHaveLength(3);
    expect(frames[0]!.phase).toBe('scan');
    expect(frames[0]!.revealedRows).toBe(1);
    expect(ALIGNMENT_PARAMETERS_POLICY.formatFrameAnswer(frames[0]!)).toBe('Pending');
    expect(frames[2]!.revealedRows).toBe(3);
    expect(ALIGNMENT_PARAMETERS_POLICY.formatFrameAnswer(frames[2]!)).toBe('1');

    const single = traceScaffold(program, ALIGNMENT_PARAMETERS_POLICY, 1);
    expect(single).toHaveLength(1);
    expect(single[0]!.revealedRows).toBe(3);
  });

  it('solves and traces Part 2 dust collection across scan and sweep phases', () => {
    const solver = new ScaffoldSolver(DUST_COLLECTION_POLICY, { maxVmSteps: 5000 });
    const program = solver.parse(DUAL_TAPE);

    expect(solver.solve(program)).toBe(54321n);

    const frames = solver.trace(program, { maxSteps: 10 });
    expect(frames.length).toBeGreaterThan(2);
    expect(frames[0]!.phase).toBe('scan');
    expect(DUST_COLLECTION_POLICY.formatFrameAnswer(frames[0]!)).toBe('Pending');

    const last = frames[frames.length - 1]!;
    expect(last.phase).toBe('sweep');
    expect(last.plan).not.toBeNull();
    expect(last.sweptPath).toHaveLength(4);
    expect(last.dust).toBe(54321n);
    expect(DUST_COLLECTION_POLICY.formatFrameAnswer(last)).toBe('54321');

    const single = solver.trace(program, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.phase).toBe('sweep');
    expect(single[0]!.dust).toBe(54321n);
  });

  it('rejects invalid trace limits', () => {
    const solver = new ScaffoldSolver(ALIGNMENT_PARAMETERS_POLICY);
    const program = solver.parse(DUAL_TAPE);
    expect(() => solver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
  });
});
