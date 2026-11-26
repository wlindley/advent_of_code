import {
  CompactionMove,
  type CompactionStrategy,
  type DiskMap,
  type FileExtent,
} from '../../shared';

function nextNonEmptyFile(files: readonly FileExtent[], fromIndex: number): number {
  let index = fromIndex;
  while (index >= 0 && files[index]!.length === 0) {
    index -= 1;
  }
  return index;
}

/** Plans O(F) two-pointer leftward block compaction across free spans and non-empty files. */
export function planBlockCompaction(disk: DiskMap): readonly CompactionMove[] {
  const { files, freeSpans } = disk;
  let si = 0;
  let fi = nextNonEmptyFile(files, files.length - 1);
  if (freeSpans.length === 0 || fi < 0) return Object.freeze([]);

  let spanPos = freeSpans[0]!.start;
  let spanRem = freeSpans[0]!.length;
  let fileRem = files[fi]!.length;
  const moves: CompactionMove[] = [];

  while (si < freeSpans.length && fi >= 0) {
    const file = files[fi]!;
    const fileTailEnd = file.start + fileRem;
    if (spanPos >= fileTailEnd) break;
    const chunk = Math.min(spanRem, fileRem);
    moves.push(new CompactionMove(file.id, fileTailEnd - chunk, spanPos, chunk));
    spanPos += chunk;
    spanRem -= chunk;
    fileRem -= chunk;
    if (spanRem === 0 && ++si < freeSpans.length) {
      spanPos = freeSpans[si]!.start;
      spanRem = freeSpans[si]!.length;
    }
    if (fileRem === 0) {
      fi = nextNonEmptyFile(files, fi - 1);
      if (fi >= 0) fileRem = files[fi]!.length;
    }
  }
  return Object.freeze(moves);
}

/** Part 1 block-by-block compaction strategy. */
export const BLOCK_COMPACTION_STRATEGY: CompactionStrategy = Object.freeze({
  id: 'block-compaction',
  label: 'Block-by-Block Compaction',
  plan: planBlockCompaction,
});
