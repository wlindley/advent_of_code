import { describe, expect, it } from 'vitest';
import { LOOP_ACCUMULATOR_POLICY, REPAIR_BOOT_POLICY } from './policy';
import { parseBootProgram } from './program';
import {
  BootTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  traceBootDiagnosis,
} from './trace';

const EXAMPLE_INPUT = [
  'nop +0',
  'acc +1',
  'jmp +4',
  'acc +3',
  'jmp -3',
  'acc -99',
  'acc +1',
  'jmp -4',
  'acc +6',
].join('\n');

describe('trace', () => {
  it('traces all executing frames plus final halt frame for Part 1 loop detection', () => {
    const program = parseBootProgram(EXAMPLE_INPUT);
    const frames = traceBootDiagnosis(program, LOOP_ACCUMULATOR_POLICY);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(240);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(8);

    const first = frames[0]!;
    expect(first).toBeInstanceOf(BootTraceFrame);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.phase).toBe('executing');
    expect(first.isHalted).toBe(false);
    expect(first.activePc).toBe(0);
    expect(first.accumulator).toBe(0n);
    expect(first.executedSteps).toBe(1);
    expect(first.visitedCount).toBe(1);
    expect(first.visitOrderAt(0)).toBe(1);
    expect(first.visitOrderAt(1)).toBeNull();
    expect(first.isPatchedStep).toBe(false);
    expect(first.patchedInstruction).toBeNull();
    expect(first.originalPatchedInstruction).toBeNull();

    const last = frames[frames.length - 1]!;
    expect(last.phase).toBe('loop-detected');
    expect(last.isHalted).toBe(true);
    expect(last.activePc).toBe(1);
    expect(last.accumulator).toBe(5n);
    expect(last.visitedCount).toBe(7);
    expect(last.visitOrderAt(4)).toBe(7);
  });

  it('traces Part 2 repair with patched step highlighting and involution metadata', () => {
    const program = parseBootProgram(EXAMPLE_INPUT);
    const frames = traceBootDiagnosis(program, REPAIR_BOOT_POLICY);
    const patchedFrames = frames.filter((f) => f.isPatchedStep);

    expect(patchedFrames.length).toBeGreaterThanOrEqual(1);
    const last = frames[frames.length - 1]!;
    expect(last.phase).toBe('terminated');
    expect(last.isHalted).toBe(true);
    expect(last.activePc).toBe(9);
    expect(last.accumulator).toBe(8n);
    expect(last.patchedInstruction!.formatted).toBe('nop -4');
    expect(last.originalPatchedInstruction!.formatted).toBe('jmp -4');
  });

  it('downsamples cleanly with monotonic visitOrder tracking and supports maxSteps = 1', () => {
    const program = parseBootProgram(EXAMPLE_INPUT);
    const sampled = traceBootDiagnosis(program, LOOP_ACCUMULATOR_POLICY, { maxSteps: 4 });
    expect(sampled).toHaveLength(4);
    expect(sampled[0]!.step.stepIndex).toBe(0);
    expect(sampled[sampled.length - 1]!.isHalted).toBe(true);
    expect(sampled[sampled.length - 1]!.visitedCount).toBe(7);

    const finalOnly = traceBootDiagnosis(program, LOOP_ACCUMULATOR_POLICY, { maxSteps: 1 });
    expect(finalOnly).toHaveLength(1);
    expect(finalOnly[0]!.isHalted).toBe(true);
    expect(finalOnly[0]!.accumulator).toBe(5n);
    expect(finalOnly[0]!.visitedCount).toBe(7);
    expect(finalOnly[0]!.visitOrderAt(0)).toBe(1);
    expect(finalOnly[0]!.visitOrderAt(4)).toBe(7);
  });

  it('defensively copies visitOrder map and rejects invalid maxSteps', () => {
    const program = parseBootProgram(EXAMPLE_INPUT);
    const mutMap = new Map<number, number>([[0, 1]]);
    const frames = traceBootDiagnosis(program, LOOP_ACCUMULATOR_POLICY);
    const copyFrame = new BootTraceFrame(
      'loop-accumulator',
      program,
      null,
      'executing',
      frames[0]!.step,
      frames[0]!.totalSteps,
      mutMap,
    );
    mutMap.set(5, 99);
    expect(copyFrame.visitOrderAt(5)).toBeNull();

    expect(() => traceBootDiagnosis(program, LOOP_ACCUMULATOR_POLICY, { maxSteps: 0 })).toThrow(
      RangeError,
    );
  });
});
