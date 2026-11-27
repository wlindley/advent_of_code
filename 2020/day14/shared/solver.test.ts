import { describe, expect, it } from 'vitest';
import { Bitmask, parseDockingProgram } from './model';
import { DECODER_V1_POLICY, DECODER_V2_POLICY } from './policies';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DockingSolver,
  MAX_MEMORY_SNAPSHOT,
  MAX_PREVIEW_WRITES,
  MemoryBank,
  TraceMemoryBank,
} from './solver';

const V1_EXAMPLE = [
  'mask = XXXXXXXXXXXXXXXXXXXXXXXXXXXXX1XXXX0X',
  'mem[8] = 11',
  'mem[7] = 101',
  'mem[8] = 0',
].join('\n');

const V2_EXAMPLE = [
  'mask = 000000000000000000000000000000X1001X',
  'mem[42] = 100',
  'mask = 00000000000000000000000000000000X0XX',
  'mem[26] = 1',
].join('\n');

describe('2020 Day 14 MemoryBank & TraceMemoryBank', () => {
  it('tracks non-zero writes, overwrites, and zero-deletions accurately', () => {
    const bank = new MemoryBank();
    expect(bank.read(5n)).toBe(0n);
    expect(bank.sum).toBe(0n);
    expect(bank.nonZeroCount).toBe(0);

    bank.write(5n, 40n);
    bank.write(9n, 12n);
    expect(bank.read(5n)).toBe(40n);
    expect(bank.sum).toBe(52n);
    expect(bank.nonZeroCount).toBe(2);

    bank.write(5n, 10n);
    expect(bank.sum).toBe(22n);
    bank.write(9n, 0n);
    expect(bank.read(9n)).toBe(0n);
    expect(bank.sum).toBe(10n);
    expect(bank.nonZeroCount).toBe(1);
  });

  it('caps writePreview at MAX_PREVIEW_WRITES and MRU snapshotRecent at MAX_MEMORY_SNAPSHOT', () => {
    const traceBank = new TraceMemoryBank();
    traceBank.beginStep(false);
    traceBank.write(99n, 7n);
    expect(traceBank.writesInStep).toBe(1);
    expect(traceBank.writePreview).toEqual([]);

    traceBank.beginStep(true);
    for (let i = 1; i <= MAX_MEMORY_SNAPSHOT + 3; i += 1) {
      traceBank.write(BigInt(i), BigInt(i * 10));
    }
    expect(traceBank.writesInStep).toBe(MAX_MEMORY_SNAPSHOT + 3);
    expect(traceBank.writePreview).toHaveLength(MAX_PREVIEW_WRITES);
    expect(traceBank.writePreview[0]).toEqual({ address: 1n, previousValue: 0n, value: 10n });

    // Re-touch oldest kept key (4n) and zero out key 5n
    traceBank.beginStep(true);
    traceBank.write(4n, 400n);
    traceBank.write(5n, 0n);
    const recent = traceBank.snapshotRecent();
    expect(recent.length).toBeLessThanOrEqual(MAX_MEMORY_SNAPSHOT);
    expect(recent[0]).toEqual({ address: 4n, value: 400n });
    expect(recent.some((e) => e.address === 5n)).toBe(false);
    expect(traceBank.sum).toBe(1517n);
    expect(traceBank.nonZeroCount).toBe(MAX_MEMORY_SNAPSHOT + 3);
  });
});

describe('2020 Day 14 DockingSolver', () => {
  it('solves Part 1 (165n) and Part 2 (208n) official examples', () => {
    const v1Solver = new DockingSolver(DECODER_V1_POLICY);
    const v2Solver = new DockingSolver(DECODER_V2_POLICY);

    expect(v1Solver.policy).toBe(DECODER_V1_POLICY);
    expect(v1Solver.solve(v1Solver.parse(V1_EXAMPLE))).toBe(165n);
    expect(v2Solver.solve(v2Solver.parse(V2_EXAMPLE))).toBe(208n);
  });

  it('produces sampled trace frames preserving exact final memory state', () => {
    const v1Solver = new DockingSolver(DECODER_V1_POLICY);
    const program = parseDockingProgram(V1_EXAMPLE);

    const allFrames = v1Solver.trace(program);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    expect(allFrames).toHaveLength(4);
    expect(Object.isFrozen(allFrames)).toBe(true);
    expect(allFrames[0]!.activeMask).toBeInstanceOf(Bitmask);
    expect(allFrames[0]!.writesInStep).toBe(0);
    expect(allFrames[3]!.isFinal).toBe(true);
    expect(allFrames[3]!.memorySum).toBe(165n);
    expect(allFrames[3]!.nonZeroCount).toBe(2);

    const sampled = v1Solver.trace(program, { maxSteps: 2 });
    expect(sampled.map((f) => [f.step, f.memorySum])).toEqual([
      [1, 0n],
      [4, 165n],
    ]);

    expect(() => v1Solver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
  });
});
