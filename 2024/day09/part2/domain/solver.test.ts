import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DiskMap,
  FileExtent,
  FreeSpan,
  parseDiskMap,
} from '../../shared';
import {
  coalesceFreeSpans,
  planWholeFileCompaction,
  solvePart2,
  solver,
  tracePart2,
  WHOLE_FILE_COMPACTION_STRATEGY,
} from './index';

describe('2024 Day 9 Part 2 whole-file compaction & solver', () => {
  it('solves official examples and freezes public outputs', () => {
    const example = solver.parse('2333133121414131402');
    const exampleMoves = planWholeFileCompaction(example);
    expect(exampleMoves).toHaveLength(4);
    expect(Object.isFrozen(exampleMoves)).toBe(true);
    expect(solver.solve(example)).toBe(2858n);

    const noMove = solver.parse('12345');
    const noMoves = planWholeFileCompaction(noMove);
    expect(noMoves).toHaveLength(0);
    expect(Object.isFrozen(noMoves)).toBe(true);
    expect(solver.solve(noMove)).toBe(132n);

    expect(solvePart2(parseDiskMap('90909'))).toBe(513n);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(Object.isFrozen(WHOLE_FILE_COMPACTION_STRATEGY)).toBe(true);
    expect(WHOLE_FILE_COMPACTION_STRATEGY.plan).toBe(planWholeFileCompaction);
  });

  it('coalesces adjacent free spans and rejects unsorted or overlapping spans', () => {
    expect(coalesceFreeSpans([])).toEqual([]);
    expect(Object.isFrozen(coalesceFreeSpans([]))).toBe(true);

    const single = coalesceFreeSpans([new FreeSpan(2, 3)]);
    expect(single).toHaveLength(1);
    expect(single[0]?.start).toBe(2);
    expect(single[0]?.length).toBe(3);

    const disjoint = coalesceFreeSpans([new FreeSpan(0, 2), new FreeSpan(4, 3)]);
    expect(disjoint.map((s) => [s.start, s.length])).toEqual([
      [0, 2],
      [4, 3],
    ]);

    const merged = coalesceFreeSpans([
      new FreeSpan(0, 5),
      new FreeSpan(5, 6),
      new FreeSpan(11, 2),
      new FreeSpan(15, 4),
    ]);
    expect(Object.isFrozen(merged)).toBe(true);
    expect(merged.map((s) => [s.start, s.length])).toEqual([
      [0, 13],
      [15, 4],
    ]);

    expect(() => coalesceFreeSpans([new FreeSpan(5, 2), new FreeSpan(1, 2)])).toThrow(RangeError);
    expect(() => coalesceFreeSpans([new FreeSpan(1, 4), new FreeSpan(3, 2)])).toThrow(RangeError);
  });

  it('handles edge cases including zero-length files and leading free spans', () => {
    const cases: readonly [string, bigint][] = [
      ['0', 0n],
      ['5', 0n],
      ['05', 0n],
      ['052', 1n],
      ['13046', 2n * (1n + 2n + 3n + 4n + 5n + 6n)],
      ['1505059', 3n * 45n],
      ['1304232', 23n],
      ['230', 0n],
    ];
    for (const [raw, expected] of cases) {
      expect(solver.solve(solver.parse(raw))).toBe(expected);
    }

    const leadingFree = new DiskMap([new FileExtent(0, 3, 2)], [new FreeSpan(0, 3)]);
    const moves = planWholeFileCompaction(leadingFree);
    expect(moves).toHaveLength(1);
    expect(moves[0]?.toStart).toBe(0);
    expect(solvePart2(leadingFree)).toBe(0n);
  });

  it('propagates invalid input and trace option errors', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('12a3')).toThrow(Error);
    const disk = solver.parse('12345');
    expect(() => tracePart2(disk, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('solves a 19,999-digit input quickly and bounds trace frames', () => {
    const largeRaw = Array.from({ length: 19_999 }, (_, i) => String((i * 7 + 3) % 10)).join('');
    const disk = solver.parse(largeRaw);
    const answer = solver.solve(disk);
    expect(answer).toBeGreaterThan(0n);

    const trace = tracePart2(disk);
    expect(trace).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(trace[0]?.appliedMoves).toBe(0);
    expect(trace[trace.length - 1]?.checksum).toBe(answer);

    const smallTrace = solver.trace!(solver.parse('2333133121414131402'), { maxSteps: 2 });
    expect(smallTrace).toHaveLength(2);
    expect(smallTrace[1]?.checksum).toBe(2858n);
  });
});
