import { describe, expect, it } from 'vitest';
import { DotSheet, FoldInstruction, OrigamiManual } from './models';
import { ALL_FOLDS_CODE_POLICY, FIRST_FOLD_COUNT_POLICY } from './policy';
import { captureOrigamiTrace, DEFAULT_TRACE_MAX_STEPS, frameSheet } from './trace';

function makeManual(): OrigamiManual {
  const sheet = new DotSheet([
    { x: 0, y: 0 },
    { x: 16, y: 16 },
  ]);
  const folds = [
    new FoldInstruction('y', 8),
    new FoldInstruction('x', 8),
    new FoldInstruction('y', 4),
    new FoldInstruction('x', 4),
  ];
  return new OrigamiManual(sheet, folds);
}

describe('trace', () => {
  it('captures full trace with omitted and empty options and extracts frameSheet', () => {
    expect(DEFAULT_TRACE_MAX_STEPS).toBe(60);
    const manual = makeManual();

    const part1Trace = captureOrigamiTrace(manual, FIRST_FOLD_COUNT_POLICY);
    expect(part1Trace).toHaveLength(2);
    expect(part1Trace[0]?.kind).toBe('initial');
    expect(part1Trace[0]?.foldsApplied).toBe(0);
    expect(frameSheet(part1Trace[0]!)).toBe(manual.initialSheet);
    expect(part1Trace[1]?.kind).toBe('folded');
    expect(part1Trace[1]?.foldsApplied).toBe(1);
    expect(frameSheet(part1Trace[1]!).dotCount).toBe(2);

    const fullTrace = captureOrigamiTrace(manual, ALL_FOLDS_CODE_POLICY, {});
    expect(fullTrace).toHaveLength(5);
    expect(fullTrace.map((f) => f.foldsApplied)).toEqual([0, 1, 2, 3, 4]);
    expect(frameSheet(fullTrace[4]!).dots).toEqual([{ x: 0, y: 0 }]);
  });

  it('samples endpoints for maxSteps = 2 and final frame only for maxSteps = 1', () => {
    const manual = makeManual();

    const two = captureOrigamiTrace(manual, ALL_FOLDS_CODE_POLICY, { maxSteps: 2 });
    expect(two.map((f) => f.foldsApplied)).toEqual([0, 4]);
    expect(frameSheet(two[1]!).dots).toEqual([{ x: 0, y: 0 }]);

    const one = captureOrigamiTrace(manual, ALL_FOLDS_CODE_POLICY, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]?.kind).toBe('folded');
    expect(one[0]?.foldsApplied).toBe(4);
    expect(frameSheet(one[0]!).dots).toEqual([{ x: 0, y: 0 }]);
  });

  it('rejects invalid maxSteps values', () => {
    const manual = makeManual();
    expect(() => captureOrigamiTrace(manual, FIRST_FOLD_COUNT_POLICY, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => captureOrigamiTrace(manual, FIRST_FOLD_COUNT_POLICY, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
