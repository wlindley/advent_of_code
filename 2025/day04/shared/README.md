# `2025/day04/shared`

## Consumer Guide
Shared pure-TypeScript warehouse floor domain model for Advent of Code 2025 Day 4 ("Printing Department").

### Public API (`2025/day04/shared/index.ts`)
- `WarehouseCell`: `'.' | '@'`
- `MAX_BLOCKING_NEIGHBORS`: `4` (rolls with fewer than 4 occupied 8-neighbors are accessible).
- `WarehouseFloor`: wraps `Grid2D<WarehouseCell>` with `rows`, `cols`, `isRoll(row, col)`, and `computeDegreeMap()`.
- `parseWarehouse(raw)`: parses rectangular `.` / `@` grids via `Grid2D.fromLines`, rejecting invalid characters with row/column context.

## Maintainer Guide
- **Sentinel-Padded Degree Map**: `computeDegreeMap()` allocates fresh `(rows + 2) * (cols + 2)` `Uint8Array` occupancy and `rows * cols` `Uint8Array` degree buffers so the 8 neighbor offsets are summed branchlessly without boundary conditions or cross-row wrap-around leakage.
- **Immutability**: `WarehouseFloor` never mutates `grid` and creates fresh buffers on each `computeDegreeMap()` call.
