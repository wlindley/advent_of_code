import { describe, expect, it } from 'vitest';
import { analyzeSyntax } from './analysis';
import { AutocompleteScanFrame, CorruptionScanFrame, DEFAULT_MAX_TRACE_STEPS } from './trace';

describe('trace frames', () => {
  it('validates inspectedCount bounds for CorruptionScanFrame and AutocompleteScanFrame', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const analysis = analyzeSyntax(['(]', '([])', '((']);
    expect(() => new CorruptionScanFrame(analysis, 0)).toThrow(RangeError);
    expect(() => new CorruptionScanFrame(analysis, 4)).toThrow(RangeError);
    expect(() => new CorruptionScanFrame(analysis, 1.5)).toThrow(RangeError);

    expect(() => new AutocompleteScanFrame(analysis, 0)).toThrow(RangeError);
    expect(() => new AutocompleteScanFrame(analysis, 2)).toThrow(RangeError);
    expect(() => new AutocompleteScanFrame(analysis, 1.2)).toThrow(RangeError);

    const noInc = analyzeSyntax(['([])', '(]']);
    expect(() => new AutocompleteScanFrame(noInc, 1)).toThrow(RangeError);
  });

  it('derives corruption running score, counts, and currentLine dynamically', () => {
    const analysis = analyzeSyntax(['([])', '(]', '((', '{>']);
    const frame1 = new CorruptionScanFrame(analysis, 1);
    expect(Object.isFrozen(frame1)).toBe(true);
    expect(frame1.kind).toBe('corruption-score');
    expect(frame1.currentLine.lineIndex).toBe(0);
    expect(frame1.runningCorruptionScore).toBe(0n);
    expect(frame1.corruptionCounts).toEqual({ ')': 0, ']': 0, '}': 0, '>': 0 });

    const frame4 = new CorruptionScanFrame(analysis, 4);
    expect(frame4.currentLine.lineIndex).toBe(3);
    expect(frame4.runningCorruptionScore).toBe(25194n);
    expect(Object.isFrozen(frame4.corruptionCounts)).toBe(true);
    expect(frame4.corruptionCounts).toEqual({ ')': 0, ']': 1, '}': 0, '>': 1 });
  });

  it('derives autocomplete inspected slice, sorted lines, running median, and max score', () => {
    const analysis = analyzeSyntax(['((', '(', '<', '([])']);
    const frame1 = new AutocompleteScanFrame(analysis, 1);
    expect(Object.isFrozen(frame1)).toBe(true);
    expect(frame1.kind).toBe('autocomplete-median');
    expect(frame1.currentLine.lineIndex).toBe(0);
    expect(frame1.inspectedIncompleteLines).toHaveLength(1);
    expect(frame1.runningMedianScore).toBe(6n);
    expect(frame1.maxInspectedScore).toBe(6n);

    const frame3 = new AutocompleteScanFrame(analysis, 3);
    expect(frame3.currentLine.lineIndex).toBe(2);
    expect(frame3.sortedInspectedLines.map((l) => l.autocompleteScore)).toEqual([1n, 4n, 6n]);
    expect(frame3.runningMedianLine.autocompleteScore).toBe(4n);
    expect(frame3.runningMedianScore).toBe(4n);
    expect(frame3.maxInspectedScore).toBe(6n);
  });
});
