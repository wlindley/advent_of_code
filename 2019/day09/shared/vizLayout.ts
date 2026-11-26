import {
  extractModeCode, type CompleteParameterMode, type DecodedMemoryRead,
  type DetailedIntcodeStep, type ParamOffset, type SparseMemoryEntry,
} from '../../shared/intcode';
import type { BoostTraceFrame } from './boostModels';

export const MAX_VISIBLE_TAPE_CELLS = 72;
export const MAX_VISIBLE_SPARSE_CELLS = 24;
export type ModeBadge = 'POS' | 'IMM' | 'REL';
export type BoostCellRole = 'write' | 'ip' | 'read' | 'param' | 'idle';
export type BoostOutputBadgeKind = 'error' | 'code' | 'pending';

export interface DisassembledParam {
  readonly offset: ParamOffset;
  readonly mode: CompleteParameterMode;
  readonly badge: ModeBadge;
  readonly rawParam: bigint;
}

export interface BoostTapeWindow {
  readonly start: number;
  readonly end: number;
  readonly truncated: boolean;
}

export interface VisibleSparseWindow {
  readonly entries: readonly SparseMemoryEntry[];
  readonly truncated: boolean;
}

const PARAM_OFFSETS: readonly ParamOffset[] = [1, 2, 3];
const MODE_BY_CODE = new Map<bigint, CompleteParameterMode>([[0n, 'position'], [1n, 'immediate'], [2n, 'relative']]);
const MODE_BADGES: Readonly<Record<CompleteParameterMode, ModeBadge>> = Object.freeze({ position: 'POS', immediate: 'IMM', relative: 'REL' });
const OPERAND_FORMATTERS: Readonly<Record<CompleteParameterMode, (read: DecodedMemoryRead<CompleteParameterMode>) => string>> = Object.freeze({
  position: (r) => `mem[${r.address}]=${r.value}`,
  immediate: (r) => `#${r.value}`,
  relative: (r) => `rel[${r.rawParam}]=mem[${r.address}]=${r.value}`,
});

function assertPositiveInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) throw new RangeError(`${label} must be a positive integer, got ${value}`);
}

/** Reads any non-negative address from base memory or sparse entries, defaulting to 0n. */
export function readFrameCell(memory: readonly bigint[], sparseEntries: readonly SparseMemoryEntry[], address: bigint): bigint {
  if (address < 0n) throw new RangeError(`Address cannot be negative: ${address}`);
  if (address < BigInt(memory.length)) return memory[Number(address)]!;
  for (const entry of sparseEntries) {
    if (entry.address === address) return entry.value;
  }
  return 0n;
}

/** Formats a decoded complete-Intcode operand according to its addressing mode. */
export function formatCompleteOperand(read: DecodedMemoryRead<CompleteParameterMode>): string {
  return OPERAND_FORMATTERS[read.mode](read);
}

/** Disassembles arity-bounded parameter slots with mode badges and raw parameter cells. */
export function decodeInstructionParams(
  step: DetailedIntcodeStep<CompleteParameterMode>,
  memory: readonly bigint[],
  sparseEntries: readonly SparseMemoryEntry[],
): readonly DisassembledParam[] {
  const params: DisassembledParam[] = [];
  for (let i = 0; i < step.arity; i += 1) {
    const offset = PARAM_OFFSETS[i]!;
    const code = extractModeCode(step.rawInstruction, offset);
    const mode = MODE_BY_CODE.get(code);
    if (!mode) throw new Error(`Unsupported parameter mode code: ${code}`);
    const rawParam = readFrameCell(memory, sparseEntries, step.ipBefore + BigInt(offset));
    params.push(Object.freeze({ offset, mode, badge: MODE_BADGES[mode], rawParam }));
  }
  return Object.freeze(params);
}

/** Classifies a base tape cell role with precedence write > ip > read > param > idle. */
export function classifyBoostCellRole(address: number, step: DetailedIntcodeStep<CompleteParameterMode>): BoostCellRole {
  const addr = BigInt(address);
  if (step.write !== null && step.write.address === addr) return 'write';
  if (step.ipBefore === addr) return 'ip';
  for (const read of step.reads) {
    if (read.address === addr) return 'read';
  }
  if (!step.halted && addr >= step.ipBefore + 1n && addr <= step.ipBefore + BigInt(step.arity)) return 'param';
  return 'idle';
}

/** Formats a concise human-readable summary for a Day 9 trace frame. */
export function formatBoostStepSummary(frame: BoostTraceFrame): string {
  const { step, relativeBaseBefore, relativeBaseAfter } = frame;
  const prefix = `#${step.stepIndex} @${step.ipBefore} ${step.mnemonic}`;
  if (step.halted) return `${prefix} -> halted`;
  if (step.opcode === 9n) return `${prefix}(${formatCompleteOperand(step.reads[0]!)}) -> RB ${relativeBaseBefore} -> ${relativeBaseAfter}`;
  const operands = step.reads.map(formatCompleteOperand);
  if (step.write !== null) {
    const args = step.inputConsumed !== null ? `in=${step.inputConsumed}` : operands.join(', ');
    return `${prefix}(${args}) -> mem[${step.write.address}]: ${step.write.previousValue} -> ${step.write.value}`;
  }
  if (step.outputEmitted !== null) return `${prefix}(${operands.join(', ')}) -> out=${step.outputEmitted}`;
  const action = step.reads.length === 2 ? 'jump' : 'next';
  return `${prefix}(${operands.join(', ')}) -> ${action} @${step.ipAfter}`;
}

/** Computes a bounded visible window of base tape cells centered on focusIndex. */
export function computeBoostTapeWindow(cellCount: number, focusIndex: number, maxVisible: number): BoostTapeWindow {
  assertPositiveInt(cellCount, 'cellCount');
  assertPositiveInt(maxVisible, 'maxVisible');
  if (cellCount <= maxVisible) return Object.freeze({ start: 0, end: cellCount, truncated: false });
  const clamped = Math.max(0, Math.min(focusIndex, cellCount - 1));
  const start = Math.max(0, Math.min(clamped - Math.floor(maxVisible / 2), cellCount - maxVisible));
  return Object.freeze({ start, end: start + maxVisible, truncated: true });
}

/** Selects up to maxVisible sparse entries centered around the active write or relative base. */
export function selectVisibleSparseEntries(
  sparseEntries: readonly SparseMemoryEntry[],
  relativeBase: bigint,
  step: DetailedIntcodeStep<CompleteParameterMode>,
  maxVisible: number,
): VisibleSparseWindow {
  assertPositiveInt(maxVisible, 'maxVisible');
  if (sparseEntries.length <= maxVisible) return Object.freeze({ entries: sparseEntries, truncated: false });
  const focusAddr = step.write !== null ? step.write.address : relativeBase;
  let focusIndex = sparseEntries.length - 1;
  for (let i = 0; i < sparseEntries.length; i += 1) {
    if (sparseEntries[i]!.address >= focusAddr) { focusIndex = i; break; }
  }
  const start = Math.max(0, Math.min(focusIndex - Math.floor(maxVisible / 2), sparseEntries.length - maxVisible));
  return Object.freeze({ entries: Object.freeze(sparseEntries.slice(start, start + maxVisible)), truncated: true });
}

/** Classifies an emitted Day 9 output badge as error (prior), code (final halted), or pending. */
export function classifyBoostOutput(index: number, outputCount: number, halted: boolean): BoostOutputBadgeKind {
  if (index < outputCount - 1) return 'error';
  return halted ? 'code' : 'pending';
}
