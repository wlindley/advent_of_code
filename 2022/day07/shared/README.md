# 2022 Day 7 Shared Domain (`2022/day07/shared`)

Pure TypeScript filesystem parser, immutable tree model, and post-order directory metrics builder for Advent of Code 2022 Day 7 ("No Space Left On Device").

## Consumer Interface

- `parser.ts`: `TerminalLine` discriminated union, `isValidEntryName(name)`, and `parseTerminalLog(raw)`.
- `model.ts`: frozen `FileEntry`, `DirectoryNode`, `DirectoryMetrics`, and `FilesystemTree` with `collectDirectoryMetrics()`.
- `builder.ts`: `buildFilesystem(lines)` and `parseFilesystem(raw)`.
- `viz/DirectoryAuditSvg.tsx`: reusable log-scaled directory audit SVG component (imported directly by part visualizers, never re-exported from `shared/index.ts`).

## Maintainer Architecture

- **DAG**: `parser.ts` -> `model.ts` -> `builder.ts` -> `index.ts` (strictly pure TS).
- **Invariants**: Directories are keyed by canonical rooted paths (`/` -> `/a` -> `/a/e`) to disambiguate duplicate basenames; derived totals (`directFileSize`, `totalSize`, `isEmpty`) are computed via dynamic getters rather than stored.
- **Complexity**: Tree construction and post-order DFS metrics collection both run in `O(D + F)` time where `D` is directory count and `F` is file count.
