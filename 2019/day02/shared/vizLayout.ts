import type { IntcodeStep } from '../../shared/intcode';

/** Maximum tape cells rendered simultaneously in the interactive memory grid. */
export const MAX_VISIBLE_TAPE_CELLS = 192;

/** Visual role assigned to each memory cell during a single Intcode step. */
export type CellRole = 'write' | 'ip' | 'read' | 'param' | 'patched' | 'idle';

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

function assertPositiveInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive integer, got ${value}`);
  }
}

/** Classifies a cell's visual role using precedence write > ip > read > param > patched > idle. */
export function classifyCellRole(address: number, step: IntcodeStep): CellRole {
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
  if (!step.halted && addr >= step.ipBefore + 1n && addr <= step.ipBefore + 3n) {
    return 'param';
  }
  if (addr === 1n || addr === 2n) {
    return 'patched';
  }
  return 'idle';
}

/** Formats a concise human-readable instruction summary for the active step. */
export function formatInstructionSummary(step: IntcodeStep): string {
  if (step.write === null) {
    return `#${step.stepIndex} @${step.ipBefore} ${step.mnemonic} -> halted`;
  }
  const operands: string[] = [];
  for (const read of step.reads) {
    operands.push(`mem[${read.address}]=${read.value}`);
  }
  const { address, previousValue, value } = step.write;
  return `#${step.stepIndex} @${step.ipBefore} ${step.mnemonic}(${operands.join(', ')}) -> mem[${address}]: ${previousValue} -> ${value}`;
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
