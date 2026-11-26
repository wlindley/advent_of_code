import { describe, expect, it } from 'vitest';
import { CpuProgram } from './program';
import { CpuTimeline, CycleSnapshot } from './timeline';

describe('CycleSnapshot & CpuTimeline', () => {
  it('executes the small 3-instruction program with exact cycle-by-cycle X and snapshots', () => {
    const program = CpuProgram.parse('noop\naddx 3\naddx -5');
    const timeline = CpuTimeline.execute(program);

    expect(Object.isFrozen(timeline)).toBe(true);
    expect(timeline.totalCycles).toBe(5);
    expect(timeline.finalX).toBe(-1);
    expect(timeline.minX).toBe(-1);
    expect(timeline.maxX).toBe(4);

    expect([1, 2, 3, 4, 5].map((c) => timeline.xDuringCycle(c))).toEqual([1, 1, 1, 4, 4]);
    expect([1, 2, 3, 4, 5].map((c) => timeline.xAfterCycle(c))).toEqual([1, 1, 4, 4, -1]);

    const s1 = timeline.snapshotAt(1);
    expect(Object.isFrozen(s1)).toBe(true);
    expect(s1.instructionIndex).toBe(0);
    expect(s1.subCycle).toBe(1);
    expect(s1.xChanged).toBe(false);
    expect(s1.crtRow).toBe(0);
    expect(s1.crtCol).toBe(0);
    expect(s1.spriteLit).toBe(true);
    expect(s1.signalStrength).toBe(1);

    const s3 = timeline.snapshotAt(3);
    expect(s3.instructionIndex).toBe(1);
    expect(s3.subCycle).toBe(2);
    expect(s3.xDuring).toBe(1);
    expect(s3.xAfter).toBe(4);
    expect(s3.xChanged).toBe(true);
    expect(s3.signalStrength).toBe(3);

    const s5 = timeline.snapshotAt(5);
    expect(s5.instructionIndex).toBe(2);
    expect(s5.subCycle).toBe(2);
    expect(s5.xDuring).toBe(4);
    expect(s5.xAfter).toBe(-1);
    expect(s5.xChanged).toBe(true);
    expect(s5.signalStrength).toBe(20);
  });

  it('computes crtRow, crtCol, and un-clamped spriteLit across boundaries', () => {
    const negAtCol0 = new CycleSnapshot(41, 0, 1, -1, -1);
    expect(negAtCol0.crtRow).toBe(1);
    expect(negAtCol0.crtCol).toBe(0);
    expect(negAtCol0.spriteLit).toBe(true);

    const negAtCol1 = new CycleSnapshot(42, 0, 1, -1, -1);
    expect(negAtCol1.crtRow).toBe(1);
    expect(negAtCol1.crtCol).toBe(1);
    expect(negAtCol1.spriteLit).toBe(false);

    const highAtCol39 = new CycleSnapshot(40, 0, 1, 40, 40);
    expect(highAtCol39.crtRow).toBe(0);
    expect(highAtCol39.crtCol).toBe(39);
    expect(highAtCol39.spriteLit).toBe(true);

    const farHighAtCol39 = new CycleSnapshot(240, 0, 1, 42, 42);
    expect(farHighAtCol39.crtRow).toBe(5);
    expect(farHighAtCol39.crtCol).toBe(39);
    expect(farHighAtCol39.spriteLit).toBe(false);
  });

  it('tracks minX and maxX when initial X is the minimum and finalX is the maximum', () => {
    const timeline = CpuTimeline.execute(CpuProgram.parse('addx 5\naddx 10'));
    expect(timeline.minX).toBe(1);
    expect(timeline.maxX).toBe(16);
    expect(timeline.finalX).toBe(16);
  });

  it('rejects out-of-range or non-integer cycle queries on CpuTimeline', () => {
    const timeline = CpuTimeline.execute(CpuProgram.parse('noop\nnoop'));
    expect(() => timeline.xDuringCycle(0)).toThrow(RangeError);
    expect(() => timeline.xDuringCycle(3)).toThrow(RangeError);
    expect(() => timeline.xDuringCycle(1.5)).toThrow(RangeError);
    expect(() => timeline.xAfterCycle(0)).toThrow(RangeError);
    expect(() => timeline.snapshotAt(3)).toThrow(RangeError);
  });

  it('guards against safe-integer overflow during execution and signalStrength calculation', () => {
    const overflowProgram = CpuProgram.parse(`addx ${Number.MAX_SAFE_INTEGER}`);
    expect(() => CpuTimeline.execute(overflowProgram)).toThrow(RangeError);

    const overflowSnap = new CycleSnapshot(2, 0, 1, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    expect(() => overflowSnap.signalStrength).toThrow(RangeError);
  });

  it('validates CycleSnapshot constructor invariants', () => {
    expect(() => new CycleSnapshot(0, 0, 1, 1, 1)).toThrow(RangeError);
    expect(() => new CycleSnapshot(1, -1, 1, 1, 1)).toThrow(RangeError);
    expect(() => new CycleSnapshot(1, 0, 3 as 1, 1, 1)).toThrow(RangeError);
    expect(() => new CycleSnapshot(1, 0, 1, 1.5, 1)).toThrow(RangeError);
    expect(() => new CycleSnapshot(1, 0, 1, 1, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});
