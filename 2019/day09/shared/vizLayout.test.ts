import { describe, expect, it } from 'vitest';
import type { CompleteParameterMode, DetailedIntcodeStep, SparseMemoryEntry } from '../../shared/intcode';
import type { BoostTraceFrame } from './boostModels';
import {
  MAX_VISIBLE_SPARSE_CELLS, MAX_VISIBLE_TAPE_CELLS,
  classifyBoostCellRole, classifyBoostOutput, computeBoostTapeWindow,
  decodeInstructionParams, formatBoostStepSummary, formatCompleteOperand,
  readFrameCell, selectVisibleSparseEntries,
} from './vizLayout';

function mkStep(
  overrides: Partial<DetailedIntcodeStep<CompleteParameterMode>>,
): DetailedIntcodeStep<CompleteParameterMode> {
  return {
    stepIndex: 0, ipBefore: 0n, ipAfter: 2n, rawInstruction: 99n, opcode: 99n, mnemonic: 'HALT',
    arity: 0, reads: [], write: null, inputConsumed: null, outputEmitted: null,
    waitingForInput: false, halted: false, ...overrides,
  };
}

const RBO_STEP = mkStep({ rawInstruction: 109n, opcode: 9n, mnemonic: 'RBO', arity: 1, reads: [{ address: 1n, rawParam: 0n, value: 0n, mode: 'immediate' }] });
const ADD_STEP = mkStep({
  stepIndex: 1, ipBefore: 2n, ipAfter: 6n, rawInstruction: 21201n, opcode: 1n, mnemonic: 'ADD', arity: 3,
  reads: [{ address: 50n, rawParam: 5n, value: 12n, mode: 'relative' }, { address: 4n, rawParam: 3n, value: 3n, mode: 'immediate' }],
  write: { address: 55n, previousValue: 0n, value: 15n },
});
const IN_STEP = mkStep({ stepIndex: 2, ipBefore: 6n, ipAfter: 8n, rawInstruction: 203n, opcode: 3n, mnemonic: 'IN', arity: 1, write: { address: 60n, previousValue: 0n, value: 1n }, inputConsumed: 1n });
const OUT_STEP = mkStep({ stepIndex: 3, ipBefore: 8n, ipAfter: 10n, rawInstruction: 4n, opcode: 4n, mnemonic: 'OUT', arity: 1, reads: [{ address: 60n, rawParam: 60n, value: 1n, mode: 'position' }], outputEmitted: 1n });
const JNZ_STEP = mkStep({ stepIndex: 4, ipBefore: 10n, ipAfter: 20n, rawInstruction: 1105n, opcode: 5n, mnemonic: 'JNZ', arity: 2, reads: [{ address: 11n, rawParam: 1n, value: 1n, mode: 'immediate' }, { address: 12n, rawParam: 20n, value: 20n, mode: 'immediate' }] });
const JZ_FALL_STEP = mkStep({ stepIndex: 5, ipBefore: 20n, ipAfter: 23n, rawInstruction: 106n, opcode: 6n, mnemonic: 'JZ', arity: 2, reads: [{ address: 21n, rawParam: 7n, value: 7n, mode: 'immediate' }] });
const HALT_STEP = mkStep({ stepIndex: 6, ipBefore: 23n, ipAfter: 23n, halted: true });

function makeFrame(step: DetailedIntcodeStep<CompleteParameterMode>, rbBefore: bigint, rbAfter: bigint): BoostTraceFrame {
  return {
    step, totalSteps: 7, relativeBaseBefore: rbBefore, relativeBaseAfter: rbAfter,
    memory: [109n, 0n, 21201n, 5n, 3n, 55n], sparseEntries: [{ address: 50n, value: 12n }],
    pendingInputs: [], outputs: [],
  };
}

describe('readFrameCell, decodeInstructionParams, and cell roles', () => {
  it('reads base hits, sparse hits, sparse misses, and rejects negative addresses', () => {
    const mem = [109n, 5n, 21201n];
    const sparse: SparseMemoryEntry[] = [{ address: 50n, value: 12n }, { address: 100n, value: 99n }];
    expect(readFrameCell(mem, sparse, 0n)).toBe(109n);
    expect(readFrameCell(mem, sparse, 100n)).toBe(99n);
    expect(readFrameCell(mem, sparse, 75n)).toBe(0n);
    expect(() => readFrameCell(mem, sparse, -1n)).toThrow(RangeError);
  });

  it('decodes arity-bounded params with POS/IMM/REL badges and rejects invalid mode code', () => {
    const mem = [109n, 0n, 21201n, 5n, 3n, 10n];
    expect(decodeInstructionParams(ADD_STEP, mem, [])).toEqual([
      { offset: 1, mode: 'relative', badge: 'REL', rawParam: 5n },
      { offset: 2, mode: 'immediate', badge: 'IMM', rawParam: 3n },
      { offset: 3, mode: 'relative', badge: 'REL', rawParam: 10n },
    ]);
    expect(decodeInstructionParams(HALT_STEP, mem, [])).toEqual([]);
    expect(() => decodeInstructionParams({ ...RBO_STEP, rawInstruction: 309n }, mem, [])).toThrow(Error);
  });

  it('classifies cell roles using write > ip > read > param > idle', () => {
    expect(classifyBoostCellRole(55, ADD_STEP)).toBe('write');
    expect(classifyBoostCellRole(2, ADD_STEP)).toBe('ip');
    expect(classifyBoostCellRole(4, ADD_STEP)).toBe('read');
    expect(classifyBoostCellRole(3, ADD_STEP)).toBe('param');
    expect(classifyBoostCellRole(1, ADD_STEP)).toBe('idle');
    expect(classifyBoostCellRole(23, HALT_STEP)).toBe('ip');
    expect(classifyBoostCellRole(24, HALT_STEP)).toBe('idle');
  });
});

describe('formatting, windows, sparse selection, and output badges', () => {
  it('formats complete operands and all BoostStepSummary shapes including 0-delta RBO', () => {
    expect(formatCompleteOperand(ADD_STEP.reads[0]!)).toBe('rel[5]=mem[50]=12');
    expect(formatBoostStepSummary(makeFrame(RBO_STEP, 10n, 10n))).toBe('#0 @0 RBO(#0) -> RB 10 -> 10');
    expect(formatBoostStepSummary(makeFrame(ADD_STEP, 45n, 45n))).toBe('#1 @2 ADD(rel[5]=mem[50]=12, #3) -> mem[55]: 0 -> 15');
    expect(formatBoostStepSummary(makeFrame(IN_STEP, 55n, 55n))).toBe('#2 @6 IN(in=1) -> mem[60]: 0 -> 1');
    expect(formatBoostStepSummary(makeFrame(OUT_STEP, 55n, 55n))).toBe('#3 @8 OUT(mem[60]=1) -> out=1');
    expect(formatBoostStepSummary(makeFrame(JNZ_STEP, 55n, 55n))).toBe('#4 @10 JNZ(#1, #20) -> jump @20');
    expect(formatBoostStepSummary(makeFrame(JZ_FALL_STEP, 55n, 55n))).toBe('#5 @20 JZ(#7) -> next @23');
    expect(formatBoostStepSummary(makeFrame(HALT_STEP, 55n, 55n))).toBe('#6 @23 HALT -> halted');
  });

  it('bounds tape and sparse windows and classifies output badges', () => {
    expect(MAX_VISIBLE_TAPE_CELLS).toBe(72);
    expect(MAX_VISIBLE_SPARSE_CELLS).toBe(24);
    expect(computeBoostTapeWindow(10, 2, 72)).toEqual({ start: 0, end: 10, truncated: false });
    expect(computeBoostTapeWindow(100, 50, 20)).toEqual({ start: 40, end: 60, truncated: true });
    expect(() => computeBoostTapeWindow(0, 0, 10)).toThrow(RangeError);
    expect(() => computeBoostTapeWindow(10, 0, 0)).toThrow(RangeError);

    const sparse: SparseMemoryEntry[] = Array.from({ length: 10 }, (_, i) => ({ address: BigInt((i + 1) * 100), value: BigInt(i) }));
    expect(selectVisibleSparseEntries(sparse, 0n, HALT_STEP, 24)).toEqual({ entries: sparse, truncated: false });
    const winWrite = selectVisibleSparseEntries(sparse, 0n, { ...IN_STEP, write: { address: 700n, previousValue: 0n, value: 1n } }, 4);
    expect(winWrite.truncated).toBe(true);
    expect(winWrite.entries.map((e) => e.address)).toEqual([500n, 600n, 700n, 800n]);
    expect(selectVisibleSparseEntries(sparse, 5000n, HALT_STEP, 4).entries.map((e) => e.address)).toEqual([700n, 800n, 900n, 1000n]);

    expect(classifyBoostOutput(0, 2, true)).toBe('error');
    expect(classifyBoostOutput(1, 2, true)).toBe('code');
    expect(classifyBoostOutput(0, 1, false)).toBe('pending');
  });
});
