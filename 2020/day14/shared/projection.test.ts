import { describe, expect, it } from 'vitest';
import { Bitmask, WORD_MASK, type DockingInstruction } from './model';
import { DockingTraceFrame, type DecoderPolicyId } from './policies';
import {
  formatInstructionLabel,
  formatUint36Binary,
  projectBitGateColumns,
  projectStepSummary,
} from './projection';

const MASK_V1 = new Bitmask('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX1XXXX0X');
const MASK_V2 = new Bitmask('000000000000000000000000000000X1001X');

function makeFrame(
  policyId: DecoderPolicyId,
  instruction: DockingInstruction,
  activeMask: Bitmask,
  writesInStep: number,
): DockingTraceFrame {
  return new DockingTraceFrame({
    policyId,
    instructionIndex: instruction.kind === 'mask' ? 0 : 1,
    totalInstructions: 2,
    instruction,
    activeMask,
    writesInStep,
    writePreview: [],
    recentMemory: [],
    memorySum: 0n,
    nonZeroCount: 0,
  });
}

describe('2020 Day 14 projection: binary & instruction formatting', () => {
  it('formats 36-bit binary strings and rejects out-of-range BigInts', () => {
    expect(formatUint36Binary(0n)).toBe('0'.repeat(36));
    expect(formatUint36Binary(11n)).toBe(`${'0'.repeat(32)}1011`);
    expect(formatUint36Binary(WORD_MASK)).toBe('1'.repeat(36));
    expect(() => formatUint36Binary(-1n)).toThrow(RangeError);
    expect(() => formatUint36Binary(WORD_MASK + 1n)).toThrow(RangeError);
  });

  it('formats mask and memory instructions', () => {
    expect(formatInstructionLabel({ kind: 'mask', mask: MASK_V1 })).toBe(`mask = ${MASK_V1.pattern}`);
    expect(formatInstructionLabel({ kind: 'mem', address: 8n, value: 11n })).toBe('mem[8] = 11');
  });
});

describe('2020 Day 14 projection: bit gate columns & step summaries', () => {
  it('projects mask-update frames with null input/output bits for v1 and v2', () => {
    const frameV1 = makeFrame('decoder-v1', { kind: 'mask', mask: MASK_V1 }, MASK_V1, 0);
    const cols = projectBitGateColumns(frameV1);
    expect(Object.isFrozen(cols)).toBe(true);
    expect(cols).toHaveLength(36);
    expect(cols[29]).toEqual({
      index: 29,
      bitPower: 6,
      maskChar: '1',
      inputBit: null,
      outputBit: null,
      role: 'force-one',
      changed: false,
    });
    expect(cols[34]!.role).toBe('force-zero');
    expect(cols[35]!.role).toBe('pass');

    const summary = projectStepSummary(frameV1);
    expect(Object.isFrozen(summary)).toBe(true);
    expect(summary.stepTitle).toContain('1×1, 1×0, 34×X');
    expect(summary.outputLabel).toBe('Decoder v1 armed');
    expect(summary.inputBinary).toBeNull();
    expect(summary.outputDisplay).toBeNull();
    expect(summary.writesSummary).toBe('0 writes');

    const frameV2 = makeFrame('decoder-v2', { kind: 'mask', mask: MASK_V2 }, MASK_V2, 0);
    expect(projectStepSummary(frameV2).outputLabel).toBe('Decoder v2 armed');
  });

  it('projects v1 value masking and v2 address floating gates accurately', () => {
    const v1Mem = makeFrame('decoder-v1', { kind: 'mem', address: 8n, value: 11n }, MASK_V1, 1);
    const v1Cols = projectBitGateColumns(v1Mem);
    expect(v1Cols[29]).toMatchObject({ inputBit: '0', outputBit: '1', role: 'force-one', changed: true });
    expect(v1Cols[34]).toMatchObject({ inputBit: '1', outputBit: '0', role: 'force-zero', changed: true });
    expect(v1Cols[35]).toMatchObject({ inputBit: '1', outputBit: '1', role: 'pass', changed: false });

    const v1Summary = projectStepSummary(v1Mem);
    expect(v1Summary.stepTitle).toBe('mem[8] = 11');
    expect(v1Summary.inputLabel).toBe('Value 11');
    expect(v1Summary.outputLabel).toBe('Masked 73 -> mem[8]');
    expect(v1Summary.outputDisplay).toBe(formatUint36Binary(73n));
    expect(v1Summary.writesSummary).toBe('1 write');

    const v2Mem = makeFrame('decoder-v2', { kind: 'mem', address: 42n, value: 100n }, MASK_V2, 4);
    const v2Cols = projectBitGateColumns(v2Mem);
    expect(v2Cols[30]).toMatchObject({ maskChar: 'X', inputBit: '1', outputBit: 'X', role: 'float', changed: true });
    expect(v2Cols[31]).toMatchObject({ maskChar: '1', inputBit: '0', outputBit: '1', role: 'force-one', changed: true });
    expect(v2Cols[32]).toMatchObject({ maskChar: '0', inputBit: '1', outputBit: '1', role: 'pass', changed: false });

    const v2Summary = projectStepSummary(v2Mem);
    expect(v2Summary.inputLabel).toBe('Address 42');
    expect(v2Summary.outputLabel).toBe('Base 26 (4 targets)');
    expect(v2Summary.outputDisplay).toBe('000000000000000000000000000000X1101X');
    expect(v2Summary.writesSummary).toBe('4 writes');

    const v2Single = makeFrame('decoder-v2', { kind: 'mem', address: 0n, value: 5n }, new Bitmask('0'.repeat(36)), 1);
    expect(projectStepSummary(v2Single).outputLabel).toBe('Base 0 (1 target)');
  });
});
