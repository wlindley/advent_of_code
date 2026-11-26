import { describe, expect, it } from 'vitest';
import { CompactionMove } from './compaction';
import { FREE_BLOCK, parseDiskMap } from './diskMap';
import { DiskBlockReplay } from './replay';

describe('DiskBlockReplay', () => {
  it('applies and reverts moves idempotently via seek', () => {
    const disk = parseDiskMap('12345');
    const moves = [
      new CompactionMove(2, 13, 1, 2),
      new CompactionMove(2, 10, 6, 3),
    ];
    const replay = new DiskBlockReplay(disk, moves);
    expect(replay.appliedMoves).toBe(0);
    expect(replay.totalMoves).toBe(2);
    expect(replay.totalBlocks).toBe(15);

    const initial = Array.from(replay.blocks);
    replay.seek(2);
    expect(replay.appliedMoves).toBe(2);
    expect(Array.from(replay.blocks)).toEqual([
      0, 2, 2, 1, 1, 1, 2, 2, 2, FREE_BLOCK, FREE_BLOCK, FREE_BLOCK, FREE_BLOCK, FREE_BLOCK, FREE_BLOCK,
    ]);

    // Idempotent seek to current step
    replay.seek(2);
    expect(replay.appliedMoves).toBe(2);

    // Seek backward to step 1, then back to 0
    replay.seek(1);
    expect(replay.appliedMoves).toBe(1);
    expect(Array.from(replay.blocks)).toEqual([
      0, 2, 2, 1, 1, 1, FREE_BLOCK, FREE_BLOCK, FREE_BLOCK, FREE_BLOCK, 2, 2, 2, FREE_BLOCK, FREE_BLOCK,
    ]);

    replay.seek(0);
    expect(replay.appliedMoves).toBe(0);
    expect(Array.from(replay.blocks)).toEqual(initial);
  });

  it('rejects out-of-bounds move endpoints and invalid seek targets', () => {
    const disk = parseDiskMap('123');
    expect(() => new DiskBlockReplay(disk, [new CompactionMove(1, 5, 1, 2)])).toThrow(RangeError);

    const replay = new DiskBlockReplay(disk, [new CompactionMove(1, 3, 1, 2)]);
    expect(() => replay.seek(-1)).toThrow(RangeError);
    expect(() => replay.seek(2)).toThrow(RangeError);
    expect(() => replay.seek(0.5)).toThrow(RangeError);
  });
});
