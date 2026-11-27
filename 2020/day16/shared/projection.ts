import { bitCount, type ClosedInterval } from '../../../shared/core';
import {
  DEPARTURE_FIELD_PREFIX,
  type ErrorScanTraceFrame,
  type FieldPeelingTraceFrame,
} from './policies';
import type { FieldAssignment } from './scanner';

export interface SpectrumBand {
  readonly startFrac: number;
  readonly endFrac: number;
  readonly startLabel: string;
  readonly endLabel: string;
}

export interface SpectrumMarker {
  readonly fieldIndex: number;
  readonly valueLabel: string;
  readonly frac: number;
  readonly isInvalid: boolean;
}

export interface SpectrumProjection {
  readonly minLabel: string;
  readonly maxLabel: string;
  readonly bands: readonly SpectrumBand[];
  readonly markers: readonly SpectrumMarker[];
}

export type PeelingCellState = 'active-lock' | 'locked' | 'candidate' | 'eliminated';

export interface PeelingMatrixRow {
  readonly ruleName: string;
  readonly isDeparture: boolean;
  readonly degree: number;
  readonly lockedColumn: number | null;
  readonly cells: readonly PeelingCellState[];
}

export interface PeelingMatrixProjection {
  readonly fieldCount: number;
  readonly rows: readonly PeelingMatrixRow[];
}

/** BigInt-safe linear normalization into [0, 1] without Number overflow. */
export function normalizeBigInt(value: bigint, min: bigint, span: bigint): number {
  if (span < 0n) {
    throw new RangeError(`span must be non-negative, got ${span}`);
  }
  if (span === 0n) return 0.5;
  return Number(((value - min) * 10_000n) / span) / 10_000;
}

function computeSpectrumBounds(
  bands: readonly ClosedInterval[],
  values: readonly bigint[],
): { readonly minVal: bigint; readonly maxVal: bigint } {
  let minVal = values[0]!;
  let maxVal = minVal;
  for (const val of values) {
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  }
  for (const band of bands) {
    if (band.start < minVal) minVal = band.start;
    if (band.end > maxVal) maxVal = band.end;
  }
  return { minVal, maxVal };
}

/** Projects an ErrorScanTraceFrame onto a normalized 1D spectrum spanning bands and ticket values. */
export function projectSpectrum(frame: ErrorScanTraceFrame): SpectrumProjection {
  const { minVal, maxVal } = computeSpectrumBounds(frame.validBands, frame.scanResult.ticket.values);
  const span = maxVal - minVal;
  const invalidSet = new Set(frame.scanResult.invalidIndices);
  const bands = frame.validBands.map((band) => Object.freeze({
    startFrac: normalizeBigInt(band.start, minVal, span),
    endFrac: normalizeBigInt(band.end, minVal, span),
    startLabel: band.start.toString(),
    endLabel: band.end.toString(),
  }));
  const markers = frame.scanResult.ticket.values.map((val, fieldIndex) => Object.freeze({
    fieldIndex,
    valueLabel: val.toString(),
    frac: normalizeBigInt(val, minVal, span),
    isInvalid: invalidSet.has(fieldIndex),
  }));
  return Object.freeze({
    minLabel: minVal.toString(),
    maxLabel: maxVal.toString(),
    bands: Object.freeze(bands),
    markers: Object.freeze(markers),
  });
}

function indexAssignments(assignments: readonly FieldAssignment[]): ReadonlyMap<string, number> {
  const map = new Map<string, number>();
  for (const entry of assignments) map.set(entry.ruleName, entry.column);
  return map;
}

function classifyMatrixCell(
  col: number,
  mask: bigint,
  activeCol: number | undefined,
  priorCol: number | undefined,
): PeelingCellState {
  if (activeCol === col) return 'active-lock';
  if (priorCol === col) return 'locked';
  if (activeCol === undefined && priorCol === undefined && (mask & (1n << BigInt(col))) !== 0n) {
    return 'candidate';
  }
  return 'eliminated';
}

/** Projects a FieldPeelingTraceFrame onto a rule-by-column compatibility matrix. */
export function projectPeelingMatrix(frame: FieldPeelingTraceFrame): PeelingMatrixProjection {
  const fieldCount = frame.ruleNames.length;
  const priorMap = indexAssignments(frame.priorAssignments);
  const activeMap = indexAssignments(frame.activeLocks);
  const rows = frame.ruleNames.map((ruleName, r) => {
    const mask = frame.masks[r]!;
    const activeCol = activeMap.get(ruleName);
    const priorCol = priorMap.get(ruleName);
    const cells: PeelingCellState[] = [];
    for (let col = 0; col < fieldCount; col += 1) {
      cells.push(classifyMatrixCell(col, mask, activeCol, priorCol));
    }
    return Object.freeze({
      ruleName,
      isDeparture: ruleName.startsWith(DEPARTURE_FIELD_PREFIX),
      degree: bitCount(mask),
      lockedColumn: activeCol ?? priorCol ?? null,
      cells: Object.freeze(cells),
    });
  });
  return Object.freeze({ fieldCount, rows: Object.freeze(rows) });
}
