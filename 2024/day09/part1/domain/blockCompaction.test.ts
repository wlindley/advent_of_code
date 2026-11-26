import { describe, expect, it } from 'vitest';
import { computeCompactedChecksum, parseDiskMap } from '../../shared';
import { BLOCK_COMPACTION_STRATEGY, planBlockCompaction } from './blockCompaction';

describe('planBlockCompaction & BLOCK_COMPACTION_STRATEGY', () => {
  it('exposes a frozen CompactionStrategy', () => {
    expect(Object.isFrozen(BLOCK_COMPACTION_STRATEGY)).toBe(true);
    expect(BLOCK_COMPACTION_STRATEGY.id).toBe('block-compaction');
    expect(BLOCK_COMPACTION_STRATEGY.label.length).toBeGreaterThan(0);
  });

  it('produces minimal leftward extent moves for example disk maps', () => {
    const disk = parseDiskMap('12345');
    const moves = BLOCK_COMPACTION_STRATEGY.plan(disk);
    expect(moves.map((m) => [m.fileId, m.fromStart, m.toStart, m.length])).toEqual([
      [2, 13, 1, 2],
      [2, 10, 6, 3],
    ]);
    expect(computeCompactedChecksum(disk, moves)).toBe(60n);
  });

  it('handles zero-move, all-free-filled, zero-length-file, and no-free-span edge cases', () => {
    // No free spans
    expect(planBlockCompaction(parseDiskMap('5'))).toEqual([]);
    // All files zero-length
    expect(planBlockCompaction(parseDiskMap('030'))).toEqual([]);
    // Free spans exhausted before files run out
    const tight = parseDiskMap('125');
    expect(computeCompactedChecksum(tight, planBlockCompaction(tight))).toBe(
      1n * (1n + 2n + 3n + 4n + 5n),
    );
    // Files exhausted before free spans run out (leading zero-length file)
    const sparse = parseDiskMap('052');
    expect(computeCompactedChecksum(sparse, planBlockCompaction(sparse))).toBe(1n * (0n + 1n));
  });
});
