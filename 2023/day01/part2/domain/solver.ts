import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  CalibrationDocument,
  type CalibrationTraceFrame,
} from '../../shared';
import { spelledDigitExtractor } from './spelledDigitExtractor';

/** Pure TypeScript solver for Advent of Code 2023 Day 1 Part 2. */
export const solver: PuzzleSolver<CalibrationDocument, number, CalibrationTraceFrame> =
  Object.freeze({
    parse(raw: string): CalibrationDocument {
      return CalibrationDocument.parse(raw);
    },

    solve(document: CalibrationDocument): number {
      return document.calibrate(spelledDigitExtractor);
    },

    trace(
      document: CalibrationDocument,
      options?: TraceOptions,
    ): readonly CalibrationTraceFrame[] {
      return document.trace(spelledDigitExtractor, options);
    },
  });
