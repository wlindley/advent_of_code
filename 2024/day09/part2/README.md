# `2024/day09/part2` — Disk Fragmenter (Part 2)

## Consumer Overview
Pure TypeScript solver and interactive disk compaction visualizer for Advent of Code 2024 Day 9 Part 2 (whole-file compaction).

- **CLI Execution**: `npm run aoc -- run 2024 9 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain API (`domain/index.ts`)**: Exports `LeftmostSpanIndex`, `coalesceFreeSpans`, `planWholeFileCompaction`, `WHOLE_FILE_COMPACTION_STRATEGY`, `solvePart2`, `tracePart2`, and `solver`.

## Maintainer Architecture
- `domain/leftmostSpanIndex.ts`: Flat `Int32Array`-backed binary max-segment tree (`LeftmostSpanIndex`) supporting `O(log S)` left-biased queries (`claimLeftmost(length, beforeStart)`) and in-place span shrinkage (`consumeAt`).
- `domain/wholeFileCompaction.ts`: `coalesceFreeSpans` merges adjacent `FreeSpan` intervals (needed when zero-length files separate free runs); `planWholeFileCompaction` iterates files in descending ID order (`O(F log S)`) and emits immutable `CompactionMove` values.
- `domain/solver.ts`: Thin Part 2 facade delegating to `computeCompactedChecksum` and `sampleCompactionTrace`.
- `domain/solver.oracle.test.ts`: Cross-validates Part 2 against two independent oracles (linear free-span scan and flat `Int32Array` block simulation) plus `DiskBlockReplay.seek()` across curated edge cases and 100 PRNG disks.
- `viz/DiskPart2Visualizer.tsx`: Thin React wrapper passing `WHOLE_FILE_COMPACTION_STRATEGY` to `../../shared/viz/DiskCompactionVisualizer`.
