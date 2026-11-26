# 2022 Day 20 Part 2 — Grove Positioning System

## Consumer Guide

- `solver.parse(raw)` -> `EncryptedFile` (validates signed integers and unique `0n` marker)
- `solver.solve(file)` -> `bigint` (sum of values at offsets `1000`, `2000`, `3000` past `0n` after scaling by `811589153n` and mixing `10` rounds)
- `solver.trace(file, options?)` -> bounded `readonly MixingTraceFrame[]` for playback
- `manifest` -> `PuzzlePartManifest` auto-discovered by `site/registry.ts`

## Maintainer Notes

- `domain/solver.ts` freezes `PART2_MIX_CONFIG = { rounds: 10, decryptionKey: 811589153n }` and delegates all parsing, BigInt-safe mixing, and trace sampling to `2022/day20/shared`.
- `domain/index.ts` re-exports `solver` as the pure domain module entrypoint.
- `viz/GrovePart2Visualizer.tsx` delegates SVG ring rendering and `PlaybackControls` state to `GroveMixerVisualizer`.
