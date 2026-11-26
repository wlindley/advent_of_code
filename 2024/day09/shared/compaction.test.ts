import { describe, expect, it } from 'vitest';
import {
  CompactionMove,
  CompactionTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  computeCompactedChecksum,
  sampleCompactionTrace,
} from './compaction';
import { parseDiskMap } from './diskMap';

describe('CompactionMove', () => {
  it('constructs frozen moves with derived ends and checksum delta', () => {
    const move = new CompactionMove(2, 10, 1, 3);
    expect(Object.isFrozen(move)).toBe(true);
    expect(move.fromEnd).toBe(13);
    expect(move.toEnd).toBe(4);
    expect(move.checksumDelta).toBe(2n * 3n * (1n - 10n));
  });

  it('rejects invalid bounds or non-leftward moves', () => {
    expect(() => new CompactionMove(-1, 5, 0, 1)).toThrow(RangeError);
    expect(() => new CompactionMove(0, 5, -1, 1)).toThrow(RangeError);
    expect(() => new CompactionMove(0, 5, 0, 0)).toThrow(RangeError);
    expect(() => new CompactionMove(0, 5, 3, 3)).toThrow(RangeError);
  });
});

describe('CompactionTraceFrame', () => {
  it('enforces initial-frame and non-initial-frame invariants', () => {
    const move = new CompactionMove(1, 4, 1, 2);
    const f0 = new CompactionTraceFrame(0, 2, null, 0, 10n);
    const f1 = new CompactionTraceFrame(1, 2, move, 2, 4n);
    expect(Object.isFrozen(f0)).toBe(true);
    expect(f1.lastMove).toBe(move);

    expect(() => new CompactionTraceFrame(0, 1, move, 0, 10n)).toThrow(RangeError);
    expect(() => new CompactionTraceFrame(1, 1, null, 2, 10n)).toThrow(RangeError);
    expect(() => new CompactionTraceFrame(2, 1, move, 2, 10n)).toThrow(RangeError);
    expect(() => new CompactionTraceFrame(-1, 1, null, 0, 10n)).toThrow(RangeError);
    expect(() => new CompactionTraceFrame(0, 1, null, -1, 10n)).toThrow(RangeError);
  });
});

describe('computeCompactedChecksum & sampleCompactionTrace', () => {
  it('computes final checksum from initialChecksum plus move deltas', () => {
    const disk = parseDiskMap('12345');
    const moves = [
      new CompactionMove(2, 13, 1, 2),
      new CompactionMove(2, 10, 6, 3),
    ];
    expect(computeCompactedChecksum(disk, moves)).toBe(60n);
  });

  it('samples all frames when moves + 1 <= maxSteps and includes empty-move disks', () => {
    const emptyMoveDisk = parseDiskMap('5');
    const emptyTrace = sampleCompactionTrace(emptyMoveDisk, []);
    expect(emptyTrace).toHaveLength(1);
    expect(emptyTrace[0]?.appliedMoves).toBe(0);
    expect(emptyTrace[0]?.lastMove).toBeNull();
    expect(emptyTrace[0]?.checksum).toBe(0n);

    const disk = parseDiskMap('12345');
    const moves = [
      new CompactionMove(2, 13, 1, 2),
      new CompactionMove(2, 10, 6, 3),
    ];
    const trace = sampleCompactionTrace(disk, moves);
    expect(trace.map((f) => [f.appliedMoves, f.blocksMoved, f.checksum])).toEqual([
      [0, 0, disk.initialChecksum],
      [1, 2, disk.initialChecksum + moves[0]!.checksumDelta],
      [2, 5, 60n],
    ]);
  });

  it('bounds long move lists to maxSteps while preserving start and end frames', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(250);
    const disk = parseDiskMap('191');
    const moves = Array.from({ length: 10 }, (_, i) => new CompactionMove(1, 20 + i, i + 1, 1));
    const sampled = sampleCompactionTrace(disk, moves, { maxSteps: 4 });
    expect(sampled).toHaveLength(4);
    expect(sampled[0]?.appliedMoves).toBe(0);
    expect(sampled[3]?.appliedMoves).toBe(10);
    expect(sampled[3]?.blocksMoved).toBe(10);

    const single = sampleCompactionTrace(disk, moves, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.appliedMoves).toBe(10);
  });
});
