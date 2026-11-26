import { describe, expect, it } from 'vitest';
import type { DetailedIntcodeStep } from '../../shared/intcode';
import {
  MAX_VISIBLE_TAPE_CELLS,
  classifyDiagnosticCellRole,
  classifyOutputBadge,
  computeTapeGridDimensions,
  computeTapeWindow,
  formatDecodedOperand,
  formatDiagnosticStepSummary,
} from './vizLayout';

const MUL_STEP: DetailedIntcodeStep = {
  stepIndex: 0,
  ipBefore: 0n,
  ipAfter: 4n,
  rawInstruction: 1002n,
  opcode: 2n,
  mnemonic: 'MUL',
  arity: 3,
  reads: [
    { address: 4n, rawParam: 4n, value: 33n, mode: 'position' },
    { address: 2n, rawParam: 3n, value: 3n, mode: 'immediate' },
  ],
  write: { address: 4n, previousValue: 33n, value: 99n },
  inputConsumed: null,
  outputEmitted: null,
  waitingForInput: false,
  halted: false,
};

const IN_STEP: DetailedIntcodeStep = {
  stepIndex: 1,
  ipBefore: 10n,
  ipAfter: 12n,
  rawInstruction: 3n,
  opcode: 3n,
  mnemonic: 'IN',
  arity: 1,
  reads: [],
  write: { address: 20n, previousValue: 0n, value: 1n },
  inputConsumed: 1n,
  outputEmitted: null,
  waitingForInput: false,
  halted: false,
};

const OUT_STEP: DetailedIntcodeStep = {
  stepIndex: 2,
  ipBefore: 12n,
  ipAfter: 14n,
  rawInstruction: 104n,
  opcode: 4n,
  mnemonic: 'OUT',
  arity: 1,
  reads: [{ address: 13n, rawParam: 42n, value: 42n, mode: 'immediate' }],
  write: null,
  inputConsumed: null,
  outputEmitted: 42n,
  waitingForInput: false,
  halted: false,
};

const JNZ_TAKEN_STEP: DetailedIntcodeStep = {
  stepIndex: 3,
  ipBefore: 14n,
  ipAfter: 25n,
  rawInstruction: 1105n,
  opcode: 5n,
  mnemonic: 'JNZ',
  arity: 2,
  reads: [
    { address: 15n, rawParam: 1n, value: 1n, mode: 'immediate' },
    { address: 16n, rawParam: 25n, value: 25n, mode: 'immediate' },
  ],
  write: null,
  inputConsumed: null,
  outputEmitted: null,
  waitingForInput: false,
  halted: false,
};

const JZ_FALL_STEP: DetailedIntcodeStep = {
  stepIndex: 4,
  ipBefore: 25n,
  ipAfter: 28n,
  rawInstruction: 106n,
  opcode: 6n,
  mnemonic: 'JZ',
  arity: 2,
  reads: [{ address: 26n, rawParam: 7n, value: 7n, mode: 'position' }],
  write: null,
  inputConsumed: null,
  outputEmitted: null,
  waitingForInput: false,
  halted: false,
};

const HALT_STEP: DetailedIntcodeStep = {
  stepIndex: 5,
  ipBefore: 28n,
  ipAfter: 28n,
  rawInstruction: 99n,
  opcode: 99n,
  mnemonic: 'HALT',
  arity: 0,
  reads: [],
  write: null,
  inputConsumed: null,
  outputEmitted: null,
  waitingForInput: false,
  halted: true,
};

describe('classifyDiagnosticCellRole', () => {
  it('uses arity-bounded params and precedence write > ip > read > param > idle', () => {
    expect(MAX_VISIBLE_TAPE_CELLS).toBe(96);
    expect(classifyDiagnosticCellRole(4, MUL_STEP)).toBe('write');
    expect(classifyDiagnosticCellRole(0, MUL_STEP)).toBe('ip');
    expect(classifyDiagnosticCellRole(2, MUL_STEP)).toBe('read');
    expect(classifyDiagnosticCellRole(1, MUL_STEP)).toBe('param');
    expect(classifyDiagnosticCellRole(3, MUL_STEP)).toBe('param');
    expect(classifyDiagnosticCellRole(5, MUL_STEP)).toBe('idle');

    // Arity 1 instruction only marks offset +1 as param, not +2 or +3.
    expect(classifyDiagnosticCellRole(11, IN_STEP)).toBe('param');
    expect(classifyDiagnosticCellRole(12, IN_STEP)).toBe('idle');
    expect(classifyDiagnosticCellRole(13, IN_STEP)).toBe('idle');
    expect(classifyDiagnosticCellRole(20, IN_STEP)).toBe('write');

    // Halted instruction has no param cells.
    expect(classifyDiagnosticCellRole(28, HALT_STEP)).toBe('ip');
    expect(classifyDiagnosticCellRole(29, HALT_STEP)).toBe('idle');
  });
});

describe('classifyOutputBadge', () => {
  it('classifies prior outputs as pass/fail and final or non-zero latest output as diagnostic', () => {
    expect(classifyOutputBadge(0, 3, 0n, false)).toBe('pass');
    expect(classifyOutputBadge(1, 3, 7n, false)).toBe('fail');
    expect(classifyOutputBadge(2, 3, 0n, false)).toBe('pass');
    expect(classifyOutputBadge(2, 3, 99n, false)).toBe('diagnostic');
    expect(classifyOutputBadge(2, 3, 0n, true)).toBe('diagnostic');
    expect(classifyOutputBadge(2, 3, 12345n, true)).toBe('diagnostic');
  });
});

describe('formatDecodedOperand & formatDiagnosticStepSummary', () => {
  it('formats position/immediate operands and all instruction summary shapes', () => {
    expect(formatDecodedOperand(MUL_STEP.reads[0]!)).toBe('mem[4]=33');
    expect(formatDecodedOperand(MUL_STEP.reads[1]!)).toBe('#3');

    expect(formatDiagnosticStepSummary(MUL_STEP)).toBe(
      '#0 @0 MUL(mem[4]=33, #3) -> mem[4]: 33 -> 99',
    );
    expect(formatDiagnosticStepSummary(IN_STEP)).toBe('#1 @10 IN(in=1) -> mem[20]: 0 -> 1');
    expect(formatDiagnosticStepSummary(OUT_STEP)).toBe('#2 @12 OUT(#42) -> out=42');
    expect(formatDiagnosticStepSummary(JNZ_TAKEN_STEP)).toBe(
      '#3 @14 JNZ(#1, #25) -> jump @25',
    );
    expect(formatDiagnosticStepSummary(JZ_FALL_STEP)).toBe(
      '#4 @25 JZ(mem[26]=7) -> next @28',
    );
    expect(formatDiagnosticStepSummary(HALT_STEP)).toBe('#5 @28 HALT -> halted');
  });
});

describe('computeTapeWindow & computeTapeGridDimensions', () => {
  it('bounds visible tape window and computes responsive grid dimensions', () => {
    expect(computeTapeWindow(24, 5, 96)).toEqual({ start: 0, end: 24, truncated: false });
    expect(computeTapeWindow(300, 0, 96)).toEqual({ start: 0, end: 96, truncated: true });
    expect(computeTapeWindow(300, 150, 96)).toEqual({ start: 102, end: 198, truncated: true });
    expect(computeTapeWindow(300, 299, 96)).toEqual({ start: 204, end: 300, truncated: true });

    expect(computeTapeGridDimensions(10, 12)).toEqual({ columns: 10, rows: 1 });
    expect(computeTapeGridDimensions(25, 12)).toEqual({ columns: 12, rows: 3 });

    expect(() => computeTapeWindow(0, 0, 10)).toThrow(RangeError);
    expect(() => computeTapeWindow(10, 0, 0)).toThrow(RangeError);
    expect(() => computeTapeGridDimensions(0, 12)).toThrow(RangeError);
    expect(() => computeTapeGridDimensions(10, 0)).toThrow(RangeError);
  });
});
