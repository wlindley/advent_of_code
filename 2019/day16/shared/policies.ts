import { runFullFft } from './fullFft';
import {
  assertNonNegativeInt,
  assertPositiveInt,
  DEFAULT_PHASES,
  MESSAGE_LENGTH,
  OFFSET_DIGITS,
  PART2_REPEAT_COUNT,
  Signal,
} from './signal';
import { solveOffsetMessage } from './tailFft';
import {
  extractFrameMessage,
  traceFullFft,
  traceTailFft,
  type FftMode,
  type FftTraceFrame,
} from './trace';

export interface FftPolicy {
  readonly id: 'full-signal' | 'offset-message';
  readonly label: string;
  readonly mode: FftMode;
  readonly phases: number;
  readonly repeatCount: number;
  readonly offsetDigits: number;
  readonly messageLength: number;
  solve(signal: Signal): string;
  trace(signal: Signal, maxSteps: number): readonly FftTraceFrame[];
  formatFrameSummary(frame: FftTraceFrame): string;
}

/** Creates a Part 1 policy that transforms the full signal and extracts its leading message. */
export function createFullSignalPolicy(phases: number, messageLength: number): FftPolicy {
  assertNonNegativeInt(phases, 'phases');
  assertPositiveInt(messageLength, 'messageLength');
  return Object.freeze({
    id: 'full-signal',
    label: 'Part 1 · Full FFT',
    mode: 'full',
    phases,
    repeatCount: 1,
    offsetDigits: 0,
    messageLength,
    solve: (signal: Signal) => runFullFft(signal, phases).sliceString(0, messageLength),
    trace: (signal: Signal, maxSteps: number) => traceFullFft(signal, phases, messageLength, maxSteps),
    formatFrameSummary: (frame: FftTraceFrame) =>
      `Phase ${frame.phase}/${frame.totalPhases} · Prefix: ${extractFrameMessage(frame)}`,
  });
}

/** Creates a Part 2 policy that computes an offset-indexed message on a repeated signal. */
export function createOffsetMessagePolicy(
  repeatCount: number,
  offsetDigits: number,
  phases: number,
  messageLength: number,
): FftPolicy {
  assertPositiveInt(repeatCount, 'repeatCount');
  assertPositiveInt(offsetDigits, 'offsetDigits');
  assertNonNegativeInt(phases, 'phases');
  assertPositiveInt(messageLength, 'messageLength');
  return Object.freeze({
    id: 'offset-message',
    label: 'Part 2 · Offset Suffix FFT',
    mode: 'tail',
    phases,
    repeatCount,
    offsetDigits,
    messageLength,
    solve: (signal: Signal) =>
      solveOffsetMessage(signal, repeatCount, offsetDigits, phases, messageLength),
    trace: (signal: Signal, maxSteps: number) =>
      traceTailFft(signal, repeatCount, signal.readOffset(offsetDigits), phases, messageLength, maxSteps),
    formatFrameSummary: (frame: FftTraceFrame) =>
      `Phase ${frame.phase}/${frame.totalPhases} · Offset ${frame.windowOffset}: ${extractFrameMessage(frame)}`,
  });
}

/** Frozen policy singleton for AoC 2019 Day 16 Part 1. */
export const FULL_SIGNAL_POLICY = createFullSignalPolicy(DEFAULT_PHASES, MESSAGE_LENGTH);

/** Frozen policy singleton for AoC 2019 Day 16 Part 2. */
export const OFFSET_MESSAGE_POLICY = createOffsetMessagePolicy(
  PART2_REPEAT_COUNT,
  OFFSET_DIGITS,
  DEFAULT_PHASES,
  MESSAGE_LENGTH,
);
