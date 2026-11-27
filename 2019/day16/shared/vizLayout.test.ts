import { describe, expect, it } from 'vitest';
import { parseSignal } from './signal';
import { traceFullFft, traceTailFft } from './trace';
import { buildPatternMatrixLayout, buildSpectrumLayout } from './vizLayout';

describe('vizLayout', () => {
  it('builds spectrum preview and digit histogram layouts from a trace frame', () => {
    const frame = traceFullFft(parseSignal('123456789012'), 1, 8, 5)[1]!;
    const layout = buildSpectrumLayout(frame);
    expect(layout.viewBox).toBe('0 0 640 240');
    expect(layout.digitBars).toHaveLength(12);
    expect(layout.digitBars.filter((bar) => bar.isMessage)).toHaveLength(8);
    expect(layout.histogramBars).toHaveLength(10);
    expect(layout.maxHistogramCount).toBeGreaterThanOrEqual(1);
    expect(layout.messageRangeWidth).toBeGreaterThan(0);
  });

  it('builds batched 3-path pattern matrix heatmap in full mode with row selection', () => {
    const frame = traceFullFft(parseSignal('80871224585914546619083218645595'), 2, 8, 5)[0]!;
    const layout = buildPatternMatrixLayout(frame, 1);
    expect(layout.size).toBe(16);
    expect(layout.selectedRow).toBe(1);
    expect(layout.plusPath.length).toBeGreaterThan(0);
    expect(layout.minusPath.length).toBeGreaterThan(0);
    expect(layout.zeroPath.length).toBeGreaterThan(0);
    expect(layout.rowWeights.slice(0, 8)).toEqual([0, 1, 1, 0, 0, -1, -1, 0]);

    const clamped = buildPatternMatrixLayout(frame, 99);
    expect(clamped.selectedRow).toBe(15);
  });

  it('builds upper-triangular 2-path matrix with empty minusPath in tail mode', () => {
    const signal = parseSignal('03036732577212944063491565474664');
    const offset = signal.readOffset(7);
    const frame = traceTailFft(signal, 10_000, offset, 2, 8, 5)[0]!;
    const layout = buildPatternMatrixLayout(frame, 3);
    expect(layout.size).toBe(16);
    expect(layout.plusPath.length).toBeGreaterThan(0);
    expect(layout.zeroPath.length).toBeGreaterThan(0);
    expect(layout.minusPath).toBe('');
    expect(layout.rowWeights.slice(0, 5)).toEqual([0, 0, 0, 1, 1]);
  });

  it('validates invalid frames and negative selectedRow', () => {
    const frame = traceFullFft(parseSignal('12345678'), 0, 8, 5)[0]!;
    expect(() => buildSpectrumLayout({ ...frame, previewDigits: [] })).toThrow(RangeError);
    expect(() => buildSpectrumLayout({ ...frame, digitHistogram: [1, 2] })).toThrow(RangeError);
    expect(() => buildPatternMatrixLayout({ ...frame, previewDigits: [] }, 0)).toThrow(RangeError);
    expect(() => buildPatternMatrixLayout(frame, -1)).toThrow(RangeError);
  });
});
