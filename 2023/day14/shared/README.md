# AoC 2023 Day 14 Shared Domain & Visualization

## Consumer Guide

- **Domain barrel (`2023/day14/shared/index.ts`)**: Pure TypeScript entrypoint (zero React/DOM/viz imports) exporting:
  - Cell constants & encoding: `CELL_EMPTY`, `CELL_CUBE`, `CELL_ROUND`, `TILT_DIRECTIONS`, `encodeCellChar`, `CellChar`, `CellByte`, `TiltDirection`.
  - Platform model & parser: `DishPlatform`, `parseDishPlatform`.
- **Visualization (`2023/day14/shared/viz/DishCanvas.tsx`)**: HiDPI `<canvas>` component rendering `#` cube rocks, weight-tinted `O` rounded rocks, optional column sweep bands, active edge indicators, and per-row north-beam load bars.

## Maintainer Architecture

- `cell.ts`: Canonical ASCII byte encoding (`'.' = 46`, `'#' = 35`, `'O' = 79`), spin-cycle direction order (`north`, `west`, `south`, `east`), and `RangeError`-guarded character validation.
- `sweep.ts`: Internal strided compaction engine (`SWEEP_BUILDERS` dispatch table mapping each `TiltDirection` to `{ lineCount, lineLength, baseOffset, lineStride, stepStride }`) for $O(H \cdot W)$ allocation-minimal tilting without `switch` chains.
- `platform.ts`: `DishPlatform` stores an immutable-encapsulated row-major `Uint8Array` (wrapper frozen via `Object.freeze(this)`, never freezing the typed array itself) and computes `roundedCount`, `rowLoads`, and `northLoad` dynamically via `#countRowRounds` with zero stored derived state.
- `platform.oracle.test.ts`: Differential oracle comparing `DishPlatform.tilt(dir)` against an independent bubble-step gravity simulator across official spin cycles and 40 seeded random grids.
