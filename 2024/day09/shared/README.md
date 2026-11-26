# `2024/day09/shared` — Disk Fragmenter Domain & Viz Primitives

## Consumer Guide
- `diskMap.ts`: `FREE_BLOCK`, `extentChecksum`, `FileExtent`, `FreeSpan`, `DiskMap`, and `parseDiskMap(raw)`.
- `compaction.ts`: `CompactionMove`, `CompactionTraceFrame`, `CompactionStrategy`, `computeCompactedChecksum`, and `sampleCompactionTrace`.
- `replay.ts`: `DiskBlockReplay` for incremental forward/backward `Int32Array` block seek.
- `index.ts`: Pure TypeScript barrel (never imports React/DOM or `viz/`).
- `viz/`: `palette.ts`, `DiskStripSvg.tsx`, `DiskPlatterCanvas.tsx`, and `DiskCompactionVisualizer.tsx`.

## Maintainer Guide
- All domain objects are frozen and compute derived metrics dynamically via getters without stored derived state.
- `DiskBlockReplay` encapsulates a single non-frozen `Int32Array` and applies/reverts moves with `Int32Array.fill`.
