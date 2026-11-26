import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS } from '../../shared';
import type { EnclosedAnalysis } from './enclosed';

export interface EnclosedScanFrame {
  readonly row: number;
  readonly totalRows: number;
  readonly northCrossings: number;
  readonly enclosedInRow: number;
  readonly cumulativeEnclosed: number;
}

interface RowSummary {
  readonly inRow: readonly number[];
  readonly cumulative: readonly number[];
}

function summarizeRows(analysis: EnclosedAnalysis): RowSummary {
  const inRow: number[] = [];
  const cumulative: number[] = [];
  let runningTotal = 0;
  for (let row = 0; row < analysis.rows; row += 1) {
    const count = analysis.enclosedInRow(row);
    runningTotal += count;
    inRow.push(count);
    cumulative.push(runningTotal);
  }
  return { inRow, cumulative };
}

function buildFrameAtRow(
  analysis: EnclosedAnalysis,
  summary: RowSummary,
  row: number,
): EnclosedScanFrame {
  return Object.freeze({
    row,
    totalRows: analysis.rows,
    northCrossings: analysis.northCrossingsAtRow(row),
    enclosedInRow: summary.inRow[row]!,
    cumulativeEnclosed: summary.cumulative[row]!,
  });
}

/** Builds a bounded sequence of row-by-row parity scan frames from an `EnclosedAnalysis`. */
export function buildEnclosedScanTrace(
  analysis: EnclosedAnalysis,
  options?: TraceOptions,
): readonly EnclosedScanFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const summary = summarizeRows(analysis);
  const sampledRows = sampleTraceIndices(analysis.rows, limit);
  const frames = sampledRows.map((row) => buildFrameAtRow(analysis, summary, row));
  return Object.freeze(frames);
}
