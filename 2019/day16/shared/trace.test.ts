import { describe, expect, it } from 'vitest';
import { parseSignal } from './signal';
import {
  DEFAULT_MAX_TRACE_STEPS,
  extractFrameMessage,
  PATTERN_MATRIX_MAX_SIZE,
  TRACE_PREVIEW_LIMIT,
  traceFullFft,
  traceTailFft,
} from './trace';

describe('trace', () => {
  it('exposes trace constants', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(40);
    expect(TRACE_PREVIEW_LIMIT).toBe(64);
    expect(PATTERN_MATRIX_MAX_SIZE).toBe(16);
  });

  it('traces all phases when phases + 1 <= maxSteps in full mode', () => {
    const signal = parseSignal('12345678');
    const frames = traceFullFft(signal, 4, 8, DEFAULT_MAX_TRACE_STEPS);
    expect(frames).toHaveLength(5);
    expect(frames[0]!.mode).toBe('full');
    expect(frames[0]!.phase).toBe(0);
    expect(frames[0]!.totalPhases).toBe(4);
    expect(frames[0]!.windowOffset).toBe(0);
    expect(extractFrameMessage(frames[0]!)).toBe('12345678');
    expect(extractFrameMessage(frames[4]!)).toBe('01029498');
    expect(frames[0]!.digitHistogram.reduce((a, b) => a + b, 0)).toBe(8);
  });

  it('uniformly samples up to maxSteps frames while preserving endpoints in full mode', () => {
    const signal = parseSignal('80871224585914546619083218645595');
    const frames = traceFullFft(signal, 100, 8, 12);
    expect(frames).toHaveLength(12);
    expect(frames[0]!.phase).toBe(0);
    expect(frames[11]!.phase).toBe(100);
    expect(extractFrameMessage(frames[11]!)).toBe('24176176');

    const singleFrame = traceFullFft(signal, 100, 8, 1);
    expect(singleFrame).toHaveLength(1);
    expect(singleFrame[0]!.phase).toBe(100);
    expect(extractFrameMessage(singleFrame[0]!)).toBe('24176176');
  });

  it('caps previewDigits at TRACE_PREVIEW_LIMIT while keeping messageLength coverage', () => {
    const longRaw = '1234567890'.repeat(10); // 100 digits
    const frames = traceFullFft(parseSignal(longRaw), 0, 8, 5);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.signalLength).toBe(100);
    expect(frames[0]!.previewDigits).toHaveLength(TRACE_PREVIEW_LIMIT);
    expect(frames[0]!.digitHistogram.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('traces tail mode with sampling and preserves offset window and final message', () => {
    const signal = parseSignal('03036732577212944063491565474664');
    const offset = signal.readOffset(7);
    const frames = traceTailFft(signal, 10_000, offset, 100, 8, 10);
    expect(frames).toHaveLength(10);
    expect(frames[0]!.mode).toBe('tail');
    expect(frames[0]!.phase).toBe(0);
    expect(frames[0]!.windowOffset).toBe(offset);
    expect(frames[9]!.phase).toBe(100);
    expect(extractFrameMessage(frames[9]!)).toBe('84462026');
    expect(frames[9]!.digitHistogram.reduce((a, b) => a + b, 0)).toBe(320_000 - offset);
  });

  it('validates bounds and maxSteps across full and tail tracing', () => {
    const signal = parseSignal('1234');
    expect(() => traceFullFft(signal, -1, 4, 10)).toThrow(RangeError);
    expect(() => traceFullFft(signal, 2, 0, 10)).toThrow(RangeError);
    expect(() => traceFullFft(signal, 2, 5, 10)).toThrow(RangeError);
    expect(() => traceFullFft(signal, 2, 4, 0)).toThrow(RangeError);
    expect(() => traceTailFft(signal, 2, 0, 5, 2, 10)).toThrow(RangeError);
    expect(() => traceTailFft(signal, 2, 4, -1, 2, 10)).toThrow(RangeError);
    expect(() => traceTailFft(signal, 2, 4, 5, 2, 0)).toThrow(RangeError);

    const frame = traceFullFft(signal, 0, 4, 5)[0]!;
    expect(() => extractFrameMessage({ ...frame, messageLength: 5 })).toThrow(RangeError);
  });
});
