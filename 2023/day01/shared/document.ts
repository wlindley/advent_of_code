import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { calibrateLine, type DigitExtractor, type LineCalibration } from './calibration';

export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Telemetry snapshot for one sampled line during calibration document scanning. */
export interface CalibrationTraceFrame {
  readonly calibration: LineCalibration;
  readonly totalLines: number;
  readonly runningSum: number;
}

/** Frozen collection of validated non-empty calibration lines. */
export class CalibrationDocument {
  readonly lines: readonly string[];

  constructor(lines: readonly string[]) {
    if (lines.length === 0) {
      throw new Error('Calibration document must contain at least one line');
    }
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i]!.trim().length === 0) {
        throw new Error(`Line ${i + 1}: calibration line must not be blank`);
      }
    }
    this.lines = Object.freeze([...lines]);
    Object.freeze(this);
  }

  get lineCount(): number {
    return this.lines.length;
  }

  /** Parses raw multi-line puzzle input into a validated CalibrationDocument. */
  static parse(raw: string): CalibrationDocument {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new Error('Calibration document must contain at least one line');
    }
    return new CalibrationDocument(trimmed.split(/\r?\n/));
  }

  /** Computes the sum of calibrated two-digit values across all lines. */
  calibrate(extractor: DigitExtractor): number {
    let sum = 0;
    for (let i = 0; i < this.lines.length; i += 1) {
      sum += calibrateLine(this.lines[i]!, i + 1, extractor).value;
    }
    return sum;
  }

  /** Calibrates every line for exact running sums and returns sampled trace frames. */
  trace(extractor: DigitExtractor, options?: TraceOptions): readonly CalibrationTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    const sampled = sampleTraceIndices(this.lines.length, maxSteps);
    const frames: CalibrationTraceFrame[] = [];
    let runningSum = 0;
    let cursor = 0;
    for (let i = 0; i < this.lines.length; i += 1) {
      const calibration = calibrateLine(this.lines[i]!, i + 1, extractor);
      runningSum += calibration.value;
      if (sampled[cursor] === i) {
        frames.push(Object.freeze({ calibration, totalLines: this.lines.length, runningSum }));
        cursor += 1;
      }
    }
    return Object.freeze(frames);
  }
}
