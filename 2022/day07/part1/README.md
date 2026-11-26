# 2022 Day 7 Part 1 — No Space Left On Device (`2022/day07/part1`)

Reconstructs an immutable directory tree from terminal navigation/listing logs and sums the total sizes of every directory whose recursive size is at most `100,000` bytes.

## Consumer Interface

- `domain/audit.ts`: exports `MAX_ELIGIBLE_DIR_SIZE` (`100_000`), `DEFAULT_MAX_TRACE_STEPS` (`120`), `DirectoryAuditTraceFrame`, `sumDirectoriesAtMost`, and `traceDirectoryAudit`.
- `domain/solver.ts`: exports `solver` (`DirectoryAuditSolver` implementing `PuzzleSolver<FilesystemTree, number, DirectoryAuditTraceFrame>`).
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with the 23-line official `exampleInput`, `exampleAnswer` (`"95437"`), `solver`, and `DirectoryAuditVisualizer`.
- `viz/DirectoryAuditVisualizer.tsx`: interactive playback visualizer over `DirectoryAuditSvg`.

## Maintainer Architecture

- **Thin Part Layer**: `part1/domain` delegates terminal parsing and tree construction to `2022/day07/shared` (`parseFilesystem`) and performs a linear scan over `collectDirectoryMetrics()`.
- **Visualization**: `DirectoryAuditVisualizer` renders a 12-row sliding window of log-scaled stacked bars (direct files vs. subdirectories), a vertical threshold marker at `100,000`, and cumulative telemetry capped at `120` sampled frames.
