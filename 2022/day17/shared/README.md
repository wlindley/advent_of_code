# 2022 Day 17 Shared Domain

## Consumer Guide
- **`parseJetPattern(raw)` / `JetPattern`**: Validates and wraps an immutable `<`/`>` jet stream sequence.
- **`Chamber`**: Bitmask-accelerated 7-column rock chamber (`dropNextRock()`, `reachableProfile()`, `stateKey()`, `snapshotWindow(maxRows)`).
- **`simulateTower(jets, targetRocks)`**: Simulates `targetRocks` (`bigint`) with cycle detection and `BigInt` cycle fast-forwarding.
- **`traceTower(jets, targetRocks, options?)`**: Produces uniformly sampled `PyroclasticTraceFrame` snapshots capped by `maxSteps` (`120` default), each carrying a 24-row window and reachable-air masks.
- **Visualizers**: Reusable React components live under `./viz/` (`ChamberCanvas.tsx`, `PyroclasticVisualizer.tsx`) and are imported directly by Part 1 and Part 2 visualizers (not re-exported from `./index.ts`).

## Maintainer Notes
- **Bitmask layout**: Each row is 7 bits (`0x7f`), with bit `6` (`0x40`) as the leftmost column (`x = 0`) and bit `0` (`0x01`) as the rightmost column (`x = 6`). Rocks are packed into 4 little-endian bytes (`byte 0` = bottom row).
- **Cycle state key**: Combines `(nextRockIndex, nextJetIndex)` with a top-down horizontal flood-fill (`floodRow`) down to the first full-width seal, ensuring exact topological equivalence before skipping `fullCycles` in `BigInt`.
- **Invariants**: `Chamber` keeps `rows[0] = FULL_ROW` so `height = rows.length - 1` is always derived and `bottomY >= 1`.
