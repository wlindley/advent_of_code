import { describe, expect, it } from 'vitest';
import type { IntcodeStep } from '../../shared/intcode';
import {
  MAX_VISIBLE_TAPE_CELLS,
  classifyCellRole,
  computeTapeGridDimensions,
  computeTapeWindow,
  formatInstructionSummary,
} from './vizLayout';

const SAMPLE_STEP: IntcodeStep = {
  stepIndex: 0,
  ipBefore: 4n,
  ipAfter: 8n,
  opcode: 2n,
  mnemonic: 'MUL',
  reads: [
    { address: 1n, value: 12n },
    { address: 11n, value: 40n },
  ],
  write: { address: 0n, previousValue: 1n, value: 480n },
  halted: false,
};

const HALT_STEP: IntcodeStep = {
  stepIndex: 2,
  ipBefore: 8n,
  ipAfter: 8n,
  opcode: 99n,
  mnemonic: 'HALT',
  reads: [],
  write: null,
  halted: true,
};

describe('classifyCellRole', () => {
  it('applies precedence write > ip > read > param > patched > idle', () => {
    expect(MAX_VISIBLE_TAPE_CELLS).toBe(192);
    expect(classifyCellRole(0, SAMPLE_STEP)).toBe('write');
    expect(classifyCellRole(4, SAMPLE_STEP)).toBe('ip');
    expect(classifyCellRole(1, SAMPLE_STEP)).toBe('read');
    expect(classifyCellRole(11, SAMPLE_STEP)).toBe('read');
    expect(classifyCellRole(5, SAMPLE_STEP)).toBe('param');
    expect(classifyCellRole(7, SAMPLE_STEP)).toBe('param');
    expect(classifyCellRole(2, SAMPLE_STEP)).toBe('patched');
    expect(classifyCellRole(10, SAMPLE_STEP)).toBe('idle');
  });

  it('gives write priority over ip on self-modifying step and omits param when halted', () => {
    const selfMod: IntcodeStep = {
      ...SAMPLE_STEP,
      write: { address: 4n, previousValue: 2n, value: 99n },
    };
    expect(classifyCellRole(4, selfMod)).toBe('write');
    expect(classifyCellRole(8, HALT_STEP)).toBe('ip');
    expect(classifyCellRole(9, HALT_STEP)).toBe('idle');
    expect(classifyCellRole(1, HALT_STEP)).toBe('patched');
  });
});

describe('formatInstructionSummary', () => {
  it('formats halted and write-producing instruction summaries cleanly', () => {
    expect(formatInstructionSummary(HALT_STEP)).toBe('#2 @8 HALT -> halted');
    expect(formatInstructionSummary(SAMPLE_STEP)).toBe(
      '#0 @4 MUL(mem[1]=12, mem[11]=40) -> mem[0]: 1 -> 480',
    );
  });
});

describe('computeTapeWindow & computeTapeGridDimensions', () => {
  it('returns full range when cellCount <= maxVisible and centered clamped window otherwise', () => {
    expect(computeTapeWindow(24, 5, 192)).toEqual({ start: 0, end: 24, truncated: false });
    expect(computeTapeWindow(300, 0, 100)).toEqual({ start: 0, end: 100, truncated: true });
    expect(computeTapeWindow(300, 150, 100)).toEqual({ start: 100, end: 200, truncated: true });
    expect(computeTapeWindow(300, 299, 100)).toEqual({ start: 200, end: 300, truncated: true });
  });

  it('computes grid columns and rows and rejects invalid positive integer inputs', () => {
    expect(computeTapeGridDimensions(12, 16)).toEqual({ columns: 12, rows: 1 });
    expect(computeTapeGridDimensions(35, 16)).toEqual({ columns: 16, rows: 3 });

    expect(() => computeTapeWindow(0, 0, 10)).toThrow(RangeError);
    expect(() => computeTapeWindow(10, 0, 0)).toThrow(RangeError);
    expect(() => computeTapeGridDimensions(0, 16)).toThrow(RangeError);
    expect(() => computeTapeGridDimensions(10, 0)).toThrow(RangeError);
  });
});
