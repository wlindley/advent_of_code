# 2022 Day 20 Part 1 — Grove Positioning System

## Consumer Interface

- `solver.parse(raw)` -> `EncryptedFile`
- `solver.solve(file)` -> `bigint` (sum of values at offsets 1000, 2000, 3000 past `0n` after 1 mixing round)
- `solver.trace(file, options?)` -> bounded `readonly MixingTraceFrame[]`
- `manifest` -> `PuzzlePartManifest` auto-discovered by `site/registry.ts`

## Maintainer Notes

- `domain/solver.ts` delegates parsing, mixing, and trace construction to `2022/day20/shared` with `PART1_MIX_CONFIG = { rounds: 1, decryptionKey: 1n }`.
- `viz/GrovePart1Visualizer.tsx` delegates SVG ring rendering and playback controls to `GroveMixerVisualizer`.
