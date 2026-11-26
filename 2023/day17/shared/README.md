# AoC 2023 Day 17 Shared Domain

## Consumer Guide

- `CrucibleRule`, `CLUMSY_CRUCIBLE_RULE` (`[1, 3]`), `ULTRA_CRUCIBLE_RULE` (`[4, 10]`): Immutable run-length bounds before turning or stopping.
- `HeatMap`, `parseHeatMap(raw)`: Immutable `Uint8Array`-backed grid of single-digit heat costs (`'1'..'9'`).
- `DialBucketQueue(stateCount, bucketCount)`: Intrusive circular bucket queue with O(1) `insert`, `decreaseKey`, and `popMin`.
- `CrucibleRouter(rule)`: Axis-alternating shortest-path search (`search`) and iso-heat wavefront trace sampling (`trace`).
- `CrucibleSearchResult`, `CrucibleTraceFrame`: Immutable search results, dynamic path/telemetry getters, and sampled wavefront snapshots.

## Maintainer Architecture

- **Axis-Alternating Graph**: Encodes `(cell << 1) | axis` (`0` = horizontal next, `1` = vertical next) so each transition marches `k` steps (`minRun <= k <= maxRun`) along one axis and switches to `1 - axis`. Eliminates the explicit `run` dimension (`O(H * W)` states).
- **Intrusive Dial Queue**: Because each leg sums at most `effectiveMaxRun` digits in `1..9`, edge weights lie in `[1, 9 * effectiveMaxRun]`. A circular array of `9 * effectiveMaxRun + 1` intrusive doubly-linked lists avoids heap allocations and duplicate queue entries.
- **Module Boundary**: `shared/index.ts` exports pure TypeScript domain modules only; React/Canvas components live under `shared/viz/` as `.tsx` files.
