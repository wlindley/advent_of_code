import { describe, expect, it } from 'vitest';
import { parseOasisReport } from './parser';
import type { ExtrapolationStrategy } from './strategy';
import {
  DEFAULT_MAX_TRACE_STEPS,
  OasisTraceFrame,
  traceOasisReport,
} from './trace';

const FORWARD: ExtrapolationStrategy = {
  direction: 'forward',
  label: 'Next Value',
  operatorSymbol: '+',
  anchorOf: (layer) => layer[layer.length - 1]!,
  combine: (anchor, below) => anchor + below,
};

const BACKWARD: ExtrapolationStrategy = {
  direction: 'backward',
  label: 'Previous Value',
  operatorSymbol: '-',
  anchorOf: (layer) => layer[0]!,
  combine: (anchor, below) => anchor - below,
};

describe('traceOasisReport and OasisTraceFrame', () => {
  it('emits descend, baseline, and ascend frames with derived getters', () => {
    const report = parseOasisReport('0 3 6 9 12 15');
    const frames = traceOasisReport(report, FORWARD);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(160);
    expect(frames).toHaveLength(5);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames[0]).toBeInstanceOf(OasisTraceFrame);
    expect(Object.isFrozen(frames[0])).toBe(true);

    expect(frames.map((f) => [f.phase, f.activeLayer, f.revealedDepth, f.extrapolatedFromLayer])).toEqual([
      ['descend', 0, 1, null],
      ['descend', 1, 2, null],
      ['baseline', 2, 3, 2],
      ['ascend', 1, 3, 1],
      ['ascend', 0, 3, 0],
    ]);

    expect(frames[2]!.activeEquation).toBeNull();
    expect(frames[3]!.isHistoryComplete).toBe(false);
    expect(frames[3]!.runningTotal).toBe(0n);
    expect(frames[3]!.activeEquation).toEqual({
      layer: 1,
      anchor: 3n,
      operator: '+',
      below: 0n,
      result: 3n,
    });
    expect(frames[4]!.isHistoryComplete).toBe(true);
    expect(frames[4]!.runningTotal).toBe(18n);
    expect(frames[4]!.activeEquation).toEqual({
      layer: 0,
      anchor: 15n,
      operator: '+',
      below: 3n,
      result: 18n,
    });
  });

  it('handles already all-zero single-layer histories in one baseline frame', () => {
    const report = parseOasisReport('0 0 0');
    const frames = traceOasisReport(report, FORWARD);
    expect(frames).toHaveLength(1);
    const frame = frames[0]!;
    expect(frame.phase).toBe('baseline');
    expect(frame.activeLayer).toBe(0);
    expect(frame.revealedDepth).toBe(1);
    expect(frame.extrapolatedFromLayer).toBe(0);
    expect(frame.isHistoryComplete).toBe(true);
    expect(frame.runningTotal).toBe(0n);
    expect(frame.activeEquation).toBeNull();
  });

  it('accumulates priorSum and runningTotal across multiple histories', () => {
    const report = parseOasisReport('0 3 6 9 12 15\n1 3 6 10 15 21');
    const frames = traceOasisReport(report, BACKWARD);
    // History 0 (depth 3 -> 5 frames): backward value = -3
    // History 1 (depth 4 -> 7 frames): backward value = 0
    expect(frames).toHaveLength(12);
    expect(frames[4]!.isHistoryComplete).toBe(true);
    expect(frames[4]!.runningTotal).toBe(-3n);
    expect(frames[5]!.historyIndex).toBe(1);
    expect(frames[5]!.priorSum).toBe(-3n);
    expect(frames[5]!.runningTotal).toBe(-3n);
    expect(frames[11]!.activeEquation?.operator).toBe('-');
    expect(frames[11]!.runningTotal).toBe(-3n);
  });

  it('uniformly samples frames to maxSteps while preserving endpoints', () => {
    const lines = Array.from({ length: 10 }, () => '1 3 6 10 15 21').join('\n');
    const report = parseOasisReport(lines);
    const frames = traceOasisReport(report, FORWARD, { maxSteps: 8 });
    expect(frames).toHaveLength(8);
    expect(frames[0]!.step).toBe(0);
    expect(frames[7]!.step).toBe(frames[7]!.totalSteps - 1);
    expect(frames[7]!.runningTotal).toBe(280n);
    expect(() => traceOasisReport(report, FORWARD, { maxSteps: 0 })).toThrow(RangeError);
  });
});
