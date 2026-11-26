import type { CompactionMove } from './compaction';
import { FREE_BLOCK, type DiskMap } from './diskMap';

/** Incremental forward/backward block-buffer replay over a sequence of compaction moves. */
export class DiskBlockReplay {
  private readonly _blocks: Int32Array;
  private readonly moves: readonly CompactionMove[];
  private _appliedMoves = 0;

  constructor(disk: DiskMap, moves: readonly CompactionMove[]) {
    const total = disk.totalBlocks;
    for (const move of moves) {
      if (move.fromEnd > total) {
        throw new RangeError(
          `CompactionMove [${move.fromStart}, ${move.fromEnd}) exceeds disk length ${total}`,
        );
      }
    }
    this._blocks = disk.expandToBlocks();
    this.moves = Object.freeze([...moves]);
  }

  get appliedMoves(): number {
    return this._appliedMoves;
  }

  get totalMoves(): number {
    return this.moves.length;
  }

  get totalBlocks(): number {
    return this._blocks.length;
  }

  get blocks(): ArrayLike<number> {
    return this._blocks;
  }

  /** Idempotently seeks the block array to `targetMoves` applied moves. */
  seek(targetMoves: number): void {
    if (!Number.isInteger(targetMoves) || targetMoves < 0 || targetMoves > this.moves.length) {
      throw new RangeError(
        `targetMoves must be an integer in [0, ${this.moves.length}], got ${targetMoves}`,
      );
    }
    while (this._appliedMoves < targetMoves) {
      const move = this.moves[this._appliedMoves]!;
      this._blocks.fill(move.fileId, move.toStart, move.toEnd);
      this._blocks.fill(FREE_BLOCK, move.fromStart, move.fromEnd);
      this._appliedMoves += 1;
    }
    while (this._appliedMoves > targetMoves) {
      this._appliedMoves -= 1;
      const move = this.moves[this._appliedMoves]!;
      this._blocks.fill(FREE_BLOCK, move.toStart, move.toEnd);
      this._blocks.fill(move.fileId, move.fromStart, move.fromEnd);
    }
  }
}
