import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { stepFftPhase } from './fullFft';
import { assertNonNegativeInt, assertPositiveInt, Signal } from './signal';
import { buildTailBuffer, stepTailPhaseInPlace, validateTailBounds } from './tailFft';

/** Default maximum sampled phase snapshots produced by `trace`. */
export const DEFAULT_MAX_TRACE_STEPS = 40;

/** Maximum number of leading digits retained in each trace frame preview. */
export const TRACE_PREVIEW_LIMIT = 64;

/** Maximum square dimension rendered by the pattern matrix heatmap. */
export const PATTERN_MATRIX_MAX_SIZE = 16;

export type FftMode = 'full' | 'tail';

export interface FftTraceFrame {
  readonly mode: FftMode;
  readonly phase: number;
  readonly totalPhases: number;
  readonly signalLength: number;
  readonly windowOffset: number;
  readonly messageLength: number;
  readonly previewDigits: readonly number[];
  readonly digitHistogram: readonly number[];
}

function computeDigitHistogram(buffer: Uint8Array): readonly number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < buffer.length; i += 1) {
    const digit = buffer[i]!;
    counts[digit] = counts[digit]! + 1;
  }
  return Object.freeze(counts);
}

function buildPreviewDigits(buffer: Uint8Array, previewLimit: number): readonly number[] {
  const count = Math.min(buffer.length, previewLimit);
  const preview = new Array<number>(count);
  for (let i = 0; i < count; i += 1) {
    preview[i] = buffer[i]!;
  }
  return Object.freeze(preview);
}

function createFrame(
  mode: FftMode,
  phase: number,
  totalPhases: number,
  signalLength: number,
  windowOffset: number,
  messageLength: number,
  buffer: Uint8Array,
): FftTraceFrame {
  const previewLimit = Math.max(TRACE_PREVIEW_LIMIT, messageLength);
  return Object.freeze({
    mode,
    phase,
    totalPhases,
    signalLength,
    windowOffset,
    messageLength,
    previewDigits: buildPreviewDigits(buffer, previewLimit),
    digitHistogram: computeDigitHistogram(buffer),
  });
}

/** Extracts the active `messageLength`-digit window from a trace frame. */
export function extractFrameMessage(frame: FftTraceFrame): string {
  assertPositiveInt(frame.messageLength, 'messageLength');
  if (frame.messageLength > frame.previewDigits.length) {
    throw new RangeError(
      `Frame preview length ${frame.previewDigits.length} is smaller than messageLength ${frame.messageLength}`,
    );
  }
  let out = '';
  for (let i = 0; i < frame.messageLength; i += 1) {
    out += String(frame.previewDigits[i]!);
  }
  return out;
}

/** Samples up to `maxSteps` phase snapshots for full FFT execution. */
export function traceFullFft(
  signal: Signal,
  phases: number,
  messageLength: number,
  maxSteps: number,
): readonly FftTraceFrame[] {
  assertNonNegativeInt(phases, 'phases');
  assertPositiveInt(messageLength, 'messageLength');
  if (messageLength > signal.length) {
    throw new RangeError(`messageLength ${messageLength} exceeds signal length ${signal.length}`);
  }
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(phases + 1, limit);
  const frames: FftTraceFrame[] = [];
  let current: Uint8Array = signal.copyToBuffer();
  let next: Uint8Array = new Uint8Array(signal.length);
  const prefix = new Int32Array(signal.length + 1);
  let sampleCursor = 0;

  for (let phase = 0; phase <= phases; phase += 1) {
    if (phase === sampled[sampleCursor]) {
      frames.push(createFrame('full', phase, phases, signal.length, 0, messageLength, current));
      sampleCursor += 1;
    }
    if (phase < phases) {
      stepFftPhase(current, next, prefix);
      const swap = current;
      current = next;
      next = swap;
    }
  }
  return Object.freeze(frames);
}

/** Samples up to `maxSteps` phase snapshots for suffix-sum tail FFT execution. */
export function traceTailFft(
  signal: Signal,
  repeatCount: number,
  offset: number,
  phases: number,
  messageLength: number,
  maxSteps: number,
): readonly FftTraceFrame[] {
  assertNonNegativeInt(phases, 'phases');
  const totalLength = signal.length * repeatCount;
  validateTailBounds(totalLength, offset, messageLength);
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(phases + 1, limit);
  const frames: FftTraceFrame[] = [];
  const tail = buildTailBuffer(signal, repeatCount, offset);
  let sampleCursor = 0;

  for (let phase = 0; phase <= phases; phase += 1) {
    if (phase === sampled[sampleCursor]) {
      frames.push(createFrame('tail', phase, phases, totalLength, offset, messageLength, tail));
      sampleCursor += 1;
    }
    if (phase < phases) {
      stepTailPhaseInPlace(tail);
    }
  }
  return Object.freeze(frames);
}
