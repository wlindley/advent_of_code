# 2020 Day 13 — Shuttle Search Shared Domain

## User / Consumer Guide

Pure TypeScript domain package modeling AoC 2020 Day 13 shuttle schedules under both earliest-departure (Part 1) and consecutive-offset alignment (Part 2) policies:

- **`model.ts`**: `BusEntry` (BigInt `id`, `offset`, `waitFrom`, `nextDepartureFrom`, `congruence`, `departsWithOffsetAt`), `BusSchedule` (validated earliest timestamp, active bus list, slot count, derived `activeCount`, `inactiveCount`, `congruences`), and strict two-line `parseBusSchedule`.
- **`policies.ts`**: `ShuttlePolicy<TTrace>`, `EarliestBusFrame`, `CrtLockFrame`, `EARLIEST_BUS_POLICY`, and `CONSECUTIVE_ALIGNMENT_POLICY` (backed by `solveCongruences` and `sampleTraceIndices` from `shared/core`).
- **`projection.ts`**: BigInt-safe ratios (`computeMaxWait`, `computeWaitBarRatio`, `computeModulusLogRatio`), `computePart1Bars`, and `computePart2Rows`.
- **`solver.ts`**: `ShuttleSolver<TTrace>` implementing `PuzzleSolver<BusSchedule, bigint, TTrace>` with `DEFAULT_MAX_TRACE_STEPS = 200`.
- **`index.ts`**: Pure TypeScript barrel (zero `viz/` or DOM imports).

## Developer / Maintainer Guide

- **No Stored Derived State**: Frame and schedule aggregates (`step`, `currentBus`, `lockedBuses`, `isNewBest`, `isFinal`, `currentWait`, `currentDeparture`, `bestWait`, `bestDeparture`, `product`, `timestamp`, `modulus`, `modulusBits`, `activeCount`, `inactiveCount`, `congruences`) are computed via getters so snapshots cannot drift.
- **Exact Sampled Trace History**: Both policies iterate all active buses once while sampling frames at `sampleTraceIndices(activeCount, maxSteps)` via a two-pointer cursor, ensuring `previousModulus` and `bestBus` remain exact even when intermediate steps are omitted.
- **Oracles**: `policies.oracle.test.ts` cross-checks generalized CRT against progressive sieving, brute-force `t = 0..lcm` scans (including compatible non-coprime moduli and leading `x`), and `> 2^64` BigInt primes.
