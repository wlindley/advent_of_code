import { describe, expect, it } from 'vitest';
import { Bitmask, type DockingInstruction } from './model';
import {
  DECODER_V1_POLICY,
  DECODER_V2_POLICY,
  DockingTraceFrame,
  type MemoryWriter,
} from './policies';

class RecordingMemory implements MemoryWriter {
  readonly writes: Array<[bigint, bigint]> = [];
  write(address: bigint, value: bigint): void {
    this.writes.push([address, value]);
  }
}

const MASK_V1 = new Bitmask('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX1XXXX0X');
const MASK_V2 = new Bitmask('000000000000000000000000000000X1001X');

describe('2020 Day 14 policies', () => {
  it('applies DECODER_V1_POLICY value masking with expectedWriteCount = 1n', () => {
    const mem = new RecordingMemory();
    const instr: DockingInstruction = { kind: 'mem', address: 8n, value: 11n };
    expect(DECODER_V1_POLICY.id).toBe('decoder-v1');
    expect(DECODER_V1_POLICY.label).toContain('v1');
    expect(DECODER_V1_POLICY.expectedWriteCount(MASK_V1)).toBe(1n);

    DECODER_V1_POLICY.executeWrite(MASK_V1, instr, mem);
    expect(mem.writes).toEqual([[8n, 73n]]);
  });

  it('applies DECODER_V2_POLICY floating address expansion', () => {
    const mem = new RecordingMemory();
    const instr: DockingInstruction = { kind: 'mem', address: 42n, value: 100n };
    expect(DECODER_V2_POLICY.id).toBe('decoder-v2');
    expect(DECODER_V2_POLICY.label).toContain('v2');
    expect(DECODER_V2_POLICY.expectedWriteCount(MASK_V2)).toBe(4n);

    DECODER_V2_POLICY.executeWrite(MASK_V2, instr, mem);
    expect(mem.writes).toEqual([
      [26n, 100n],
      [27n, 100n],
      [58n, 100n],
      [59n, 100n],
    ]);
  });
});

describe('2020 Day 14 DockingTraceFrame', () => {
  it('freezes collections and derives step, isFinal, isWriteStep, truncatedWriteCount', () => {
    const maskInstr: DockingInstruction = { kind: 'mask', mask: MASK_V1 };
    const memInstr: DockingInstruction = { kind: 'mem', address: 8n, value: 11n };

    const first = new DockingTraceFrame({
      policyId: 'decoder-v1',
      instructionIndex: 0,
      totalInstructions: 2,
      instruction: maskInstr,
      activeMask: MASK_V1,
      writesInStep: 0,
      writePreview: [],
      recentMemory: [],
      memorySum: 0n,
      nonZeroCount: 0,
    });
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.writePreview)).toBe(true);
    expect(Object.isFrozen(first.recentMemory)).toBe(true);
    expect(first.step).toBe(1);
    expect(first.isFinal).toBe(false);
    expect(first.isWriteStep).toBe(false);
    expect(first.truncatedWriteCount).toBe(0);

    const last = new DockingTraceFrame({
      policyId: 'decoder-v2',
      instructionIndex: 1,
      totalInstructions: 2,
      instruction: memInstr,
      activeMask: MASK_V2,
      writesInStep: 10,
      writePreview: [{ address: 26n, previousValue: 0n, value: 100n }],
      recentMemory: [{ address: 26n, value: 100n }],
      memorySum: 400n,
      nonZeroCount: 4,
    });
    expect(last.step).toBe(2);
    expect(last.isFinal).toBe(true);
    expect(last.isWriteStep).toBe(true);
    expect(last.truncatedWriteCount).toBe(9);
  });

  it('rejects invalid totalInstructions, instructionIndex, and writesInStep', () => {
    const base = {
      policyId: 'decoder-v1' as const,
      instructionIndex: 0,
      totalInstructions: 2,
      instruction: { kind: 'mask' as const, mask: MASK_V1 },
      activeMask: MASK_V1,
      writesInStep: 0,
      writePreview: [],
      recentMemory: [],
      memorySum: 0n,
      nonZeroCount: 0,
    };

    expect(() => new DockingTraceFrame({ ...base, totalInstructions: 0 })).toThrow(RangeError);
    expect(() => new DockingTraceFrame({ ...base, totalInstructions: 1.5 })).toThrow(RangeError);
    expect(() => new DockingTraceFrame({ ...base, instructionIndex: -1 })).toThrow(RangeError);
    expect(() => new DockingTraceFrame({ ...base, instructionIndex: 2 })).toThrow(RangeError);
    expect(() => new DockingTraceFrame({ ...base, instructionIndex: 0.5 })).toThrow(RangeError);
    expect(() => new DockingTraceFrame({ ...base, writesInStep: -1 })).toThrow(RangeError);
  });
});
