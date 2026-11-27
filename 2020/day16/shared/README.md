# 2020 Day 16 Shared Ticket Translation Engine

## User / Consumer Overview
Provides the pure TypeScript domain model, ticket scanner, BigInt constraint-peeling resolver, policy-parameterized solver, visualization projections, and shared React visualizers for Advent of Code 2020 Day 16 (*Ticket Translation*).

### Public Entrypoints
- `shared/index.ts`: Pure TypeScript barrel exporting `FieldRule`, `Ticket`, `TicketDocument`, `parseTicketDocument`, `TicketScanResult`, `scanTicket`, `scanNearbyTickets`, `buildCompatibilityMasks`, `resolveFieldMapping`, `ERROR_RATE_POLICY`, `DEPARTURE_PRODUCT_POLICY`, `TicketTranslationSolver`, `projectSpectrum`, and `projectPeelingMatrix`.
- `shared/viz/TicketVisualizer.tsx`: Shared React playback visualizer dispatching between `SpectrumScannerSvg` (error scanning) and `PeelingMatrixSvg` (constraint peeling).

## Developer / Maintainer Architecture
- **Dependency DAG**: `model.ts` -> `scanner.ts` -> `policies.ts` -> `solver.ts` & `projection.ts` -> `shared/index.ts` -> `shared/viz/*.tsx`.
- **BigInt Precision**: All ticket values, interval bounds (`ClosedInterval`), error sums, departure products, and compatibility bitmasks use `bigint`. Column extraction uses `bigintLog2`, avoiding 53-bit `Number` precision limits for wide inputs.
- **Invalid-Zero Invariant**: `TicketScanResult.isValid` checks `invalidIndices.length === 0` rather than `invalidSum === 0n` so tickets containing an out-of-range `0n` are never misclassified as valid.
- **Dynamic Derived State**: `TicketDocument.validUnion`, `TicketScanResult.isValid`/`invalidSum`, `FieldResolution.columnByField`, and trace frame metrics are computed via getters from underlying immutable frozen data.
