import { describe, expect, it } from 'vitest';
import { LensBoxSnapshot, LensEntry } from './bench';
import { parseLensInstructions, UpsertLensInstruction } from './instruction';
import { DEFAULT_MAX_TRACE_STEPS, HashmapTraceFrame, traceHashmapSequence } from './trace';

const OFFICIAL_EXAMPLE = 'rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7';

describe('HashmapTraceFrame', () => {
  const sampleInstruction = new UpsertLensInstruction('rn', 1);
  const sampleOutcome = { kind: 'inserted', slot: 0 } as const;
  const sampleBox = new LensBoxSnapshot(0, [new LensEntry('rn', 1)]);

  it('freezes frame and computes dynamic telemetry getters', () => {
    const box3 = new LensBoxSnapshot(3, [new LensEntry('pc', 6), new LensEntry('ot', 7)]);
    const frame = new HashmapTraceFrame(0, 2, 11, sampleInstruction, sampleOutcome, [
      sampleBox,
      box3,
    ]);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.occupiedBoxes)).toBe(true);
    expect(frame.processedCount).toBe(3);
    expect(frame.occupiedBoxCount).toBe(2);
    expect(frame.totalLensCount).toBe(3);
    expect(frame.focusingPower).toBe(sampleBox.focusingPower + box3.focusingPower);
    expect(frame.labelTransitions.map((t) => t.after)).toEqual([146, 0]);
  });

  it('allows empty occupiedBoxes when all boxes are empty', () => {
    const frame = new HashmapTraceFrame(0, 0, 1, sampleInstruction, { kind: 'noop' }, []);
    expect(frame.occupiedBoxCount).toBe(0);
    expect(frame.totalLensCount).toBe(0);
    expect(frame.focusingPower).toBe(0);
  });

  it('rejects invalid frameIndex, stepIndex, and totalSteps', () => {
    expect(
      () => new HashmapTraceFrame(-1, 0, 1, sampleInstruction, sampleOutcome, []),
    ).toThrow(RangeError);
    expect(
      () => new HashmapTraceFrame(0.5, 0, 1, sampleInstruction, sampleOutcome, []),
    ).toThrow(RangeError);
    expect(
      () => new HashmapTraceFrame(0, -1, 1, sampleInstruction, sampleOutcome, []),
    ).toThrow(RangeError);
    expect(
      () => new HashmapTraceFrame(0, 0, 0, sampleInstruction, sampleOutcome, []),
    ).toThrow(RangeError);
    expect(
      () => new HashmapTraceFrame(0, 1, 1, sampleInstruction, sampleOutcome, []),
    ).toThrow(RangeError);
  });

  it('rejects empty boxes or non-increasing boxIndex in occupiedBoxes', () => {
    const emptyBox = new LensBoxSnapshot(0, []);
    expect(
      () => new HashmapTraceFrame(0, 0, 1, sampleInstruction, sampleOutcome, [emptyBox]),
    ).toThrow(RangeError);

    const box5 = new LensBoxSnapshot(5, [new LensEntry('ab', 1)]);
    const box2 = new LensBoxSnapshot(2, [new LensEntry('cd', 2)]);
    expect(
      () => new HashmapTraceFrame(0, 0, 1, sampleInstruction, sampleOutcome, [box5, box2]),
    ).toThrow(RangeError);
    expect(
      () => new HashmapTraceFrame(0, 0, 1, sampleInstruction, sampleOutcome, [sampleBox, sampleBox]),
    ).toThrow(RangeError);
  });
});

describe('traceHashmapSequence', () => {
  it('returns frozen empty array for empty instructions', () => {
    const frames = traceHashmapSequence([]);
    expect(frames).toEqual([]);
    expect(Object.isFrozen(frames)).toBe(true);
  });

  it('traces all 11 official example steps with expected outcomes and final focusing power 145', () => {
    const instructions = parseLensInstructions(OFFICIAL_EXAMPLE);
    const frames = traceHashmapSequence(instructions, {});
    expect(frames).toHaveLength(11);
    expect(frames.map((f) => f.outcome.kind)).toEqual([
      'inserted',
      'noop',
      'inserted',
      'inserted',
      'removed',
      'inserted',
      'inserted',
      'inserted',
      'removed',
      'inserted',
      'replaced',
    ]);
    const last = frames[frames.length - 1]!;
    expect(last.processedCount).toBe(11);
    expect(last.focusingPower).toBe(145);
    expect(last.occupiedBoxes.map((b) => b.boxIndex)).toEqual([0, 3]);
  });

  it('samples endpoints cleanly for maxSteps: 4 and maxSteps: 1', () => {
    const instructions = parseLensInstructions(OFFICIAL_EXAMPLE);
    const sampled4 = traceHashmapSequence(instructions, { maxSteps: 4 });
    expect(sampled4).toHaveLength(4);
    expect(sampled4.map((f) => f.stepIndex)).toEqual([0, 3, 7, 10]);
    expect(sampled4[3]!.focusingPower).toBe(145);

    const sampled1 = traceHashmapSequence(instructions, { maxSteps: 1 });
    expect(sampled1).toHaveLength(1);
    expect(sampled1[0]!.stepIndex).toBe(10);
    expect(sampled1[0]!.focusingPower).toBe(145);
  });

  it('caps a 300-step sequence at DEFAULT_MAX_TRACE_STEPS (120)', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const instructions = Array.from(
      { length: 300 },
      (_, i) => new UpsertLensInstruction('rn', (i % 9) + 1),
    );
    const frames = traceHashmapSequence(instructions);
    expect(frames).toHaveLength(120);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[119]!.stepIndex).toBe(299);
  });

  it('rejects invalid maxSteps options', () => {
    const instructions = parseLensInstructions('rn=1');
    expect(() => traceHashmapSequence(instructions, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceHashmapSequence(instructions, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceHashmapSequence(instructions, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
