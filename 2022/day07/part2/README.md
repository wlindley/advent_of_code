# 2022 Day 7 Part 2 — No Space Left On Device (`2022/day07/part2`)

Reconstructs an immutable directory tree from terminal navigation/listing logs and finds the smallest directory whose deletion frees enough space to reach `30,000,000` bytes on a `70,000,000`-byte disk.

## Consumer Interface

- `domain/deletion.ts`: exports `TOTAL_DISK_SPACE` (`70_000_000`), `REQUIRED_FREE_SPACE` (`30_000_000`), `DEFAULT_MAX_TRACE_STEPS` (`120`), `DirectoryDeletionTraceFrame`, `findSmallestDirectoryToDelete`, and `traceDirectoryDeletion`.
- `domain/solver.ts`: exports `solver` (`DirectoryDeletionSolver` implementing `PuzzleSolver<FilesystemTree, number, DirectoryDeletionTraceFrame>`).
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with the 23-line official `exampleInput`, `exampleAnswer` (`"24933642"`), `solver`, and `DirectoryDeletionVisualizer`.
- `viz/DirectoryDeletionVisualizer.tsx`: interactive playback visualizer over `DirectoryAuditSvg`.

## Maintainer Architecture

- **Thin Part Layer**: `part2/domain` delegates terminal parsing and tree construction to `2022/day07/shared` (`parseFilesystem`) and performs a single linear scan over `collectDirectoryMetrics()` to minimize qualifying `totalSize`.
- **Visualization**: `DirectoryDeletionVisualizer` renders a 12-row sliding window of log-scaled stacked bars, a vertical threshold marker at `neededSpace`, `best` candidate highlighting, and disk telemetry capped at `120` sampled frames.
