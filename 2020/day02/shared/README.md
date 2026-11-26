# `2020/day02/shared` — Password Philosophy Core & Visualization Primitives

## Consumer Guide
Pure TypeScript domain model, policy evaluators (`SLED_RENTAL_POLICY`, `TOBOGGAN_POLICY`), and bounded audit tracer for Advent of Code 2020 Day 2, plus reusable React visualization components under `viz/`.

- `parsePasswordDatabase(raw)` / `PasswordDatabase` / `PasswordEntry`: validates `<first>-<second> <letter>: <password>` lines into immutable, frozen domain objects.
- `SLED_RENTAL_POLICY` / `TOBOGGAN_POLICY`: polymorphic `PasswordValidationPolicy` implementations producing dynamic `PolicyEvaluation` snapshots.
- `countValidPasswords(database, policy)` & `tracePasswordAudit(database, policy, maxSteps?)`: counts valid entries and samples up to `maxSteps` (`120` default) `AuditTraceFrame` steps in a single pass.
- `viz/PasswordAuditVisualizer.tsx`: parameterizable React visualizer (`policy`, `rawInput`) combining `PasswordStrip` and `PlaybackControls`.

## Maintainer Guide
- **Module DAG**: `passwordEntry.ts` → `policy.ts` → `audit.ts` → `index.ts`; `viz/*.tsx` imports from `../index` and `../../../../shared/viz`. `index.ts` stays pure TypeScript with zero React/DOM imports.
- **No Stored Derived State**: `SledEvaluation`, `TobogganEvaluation`, and `AuditTraceFrame` freeze only primary state and compute indices, verdicts, and cumulative counters dynamically via getters.
