import type { DecodedMemoryRead, DetailedIntcodeStep, ParameterMode } from '../../shared/intcode';

/** Maximum tape cells rendered simultaneously in the Day 5 memory grid. */
export const MAX_VISIBLE_TAPE_CELLS = 96;

/** Visual role assigned to each memory cell during a single Day 5 Intcode step. */
export type DiagnosticCellRole = 'write' | 'ip' | 'read' | 'param' | 'idle';

/** Semantic badge kind assigned to each emitted diagnostic output value. */
export type OutputBadgeKind = 'pass' | 'fail' | 'diagnostic';

/** Inclusive-exclusive visible slice [start, end) of the Intcode memory tape. */
export interface TapeWindow {
  readonly start: number;
  readonly end: number;
  readonly truncated: boolean;
}

/** Responsive grid dimensions for rendering the visible memory tape window. */
export interface TapeGridDimensions {
  readonly columns: number;
  readonly rows: number;
}

const OPERAND_FORMATTERS: Readonly<Record<ParameterMode, (read: DecodedMemoryRead) => string>> =
  Object.freeze({
    position: (read) => `mem[${read.address}]=${read.value}`,
    immediate: (read) => `#${read.value}`,
  });

function assertPositiveInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive integer, got ${value}`);
  }
}

/** Classifies a tape cell role using arity-bounded params and write > ip > read > param > idle. */
export function classifyDiagnosticCellRole(
  address: number,
  step: DetailedIntcodeStep,
): DiagnosticCellRole {
  const addr = BigInt(address);
  if (step.write !== null && step.write.address === addr) {
    return 'write';
  }
  if (step.ipBefore === addr) {
    return 'ip';
  }
  for (const read of step.reads) {
    if (read.address === addr) {
      return 'read';
    }
  }
  if (!step.halted && addr >= step.ipBefore + 1n && addr <= step.ipBefore + BigInt(step.arity)) {
    return 'param';
  }
  return 'idle';
}

/** Classifies an output badge as pass (0), fail (!= 0), or final diagnostic code. */
export function classifyOutputBadge(
  index: number,
  outputCount: number,
  value: bigint,
  halted: boolean,
): OutputBadgeKind {
  const isLatest = index === outputCount - 1;
  if (isLatest && (halted || value !== 0n)) {
    return 'diagnostic';
  }
  return value === 0n ? 'pass' : 'fail';
}

/** Formats a decoded operand according to its parameter addressing mode. */
export function formatDecodedOperand(read: DecodedMemoryRead): string {
  return OPERAND_FORMATTERS[read.mode](read);
}

/** Formats a concise human-readable instruction summary for the active Day 5 step. */
export function formatDiagnosticStepSummary(step: DetailedIntcodeStep): string {
  const prefix = `#${step.stepIndex} @${step.ipBefore} ${step.mnemonic}`;
  if (step.halted) {
    return `${prefix} -> halted`;
  }
  const operands = step.reads.map(formatDecodedOperand);
  if (step.write !== null) {
    const args = step.inputConsumed !== null ? `in=${step.inputConsumed}` : operands.join(', ');
    const { address, previousValue, value } = step.write;
    return `${prefix}(${args}) -> mem[${address}]: ${previousValue} -> ${value}`;
  }
  if (step.outputEmitted !== null) {
    return `${prefix}(${operands.join(', ')}) -> out=${step.outputEmitted}`;
  }
  const action = step.reads.length === 2 ? 'jump' : 'next';
  return `${prefix}(${operands.join(', ')}) -> ${action} @${step.ipAfter}`;
}

/** Computes a bounded visible tape window centered around focusIndex. */
export function computeTapeWindow(
  cellCount: number,
  focusIndex: number,
  maxVisible: number,
): TapeWindow {
  assertPositiveInt(cellCount, 'cellCount');
  assertPositiveInt(maxVisible, 'maxVisible');
  if (cellCount <= maxVisible) {
    return Object.freeze({ start: 0, end: cellCount, truncated: false });
  }
  const clampedFocus = Math.max(0, Math.min(focusIndex, cellCount - 1));
  const half = Math.floor(maxVisible / 2);
  const start = Math.max(0, Math.min(clampedFocus - half, cellCount - maxVisible));
  return Object.freeze({ start, end: start + maxVisible, truncated: true });
}

/** Computes grid column and row counts for a visible cell slice. */
export function computeTapeGridDimensions(
  cellCount: number,
  maxColumns: number,
): TapeGridDimensions {
  assertPositiveInt(cellCount, 'cellCount');
  assertPositiveInt(maxColumns, 'maxColumns');
  const columns = Math.min(cellCount, maxColumns);
  const rows = Math.ceil(cellCount / columns);
  return Object.freeze({ columns, rows });
}
