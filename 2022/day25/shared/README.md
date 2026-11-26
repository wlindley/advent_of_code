# 2022 Day 25 Shared Domain — Full of Hot Air (SNAFU)

## Consumer Guide

- `index.ts` exports pure TypeScript balanced base-5 (SNAFU) primitives (zero React/DOM or `viz/` imports):
  - `decodeSnafu` / `encodeSnafu` / `snafuDigitToValue` convert between balanced quinary strings (`=`, `-`, `0`, `1`, `2`) and exact signed `bigint` values.
  - `SnafuNumber` validates a SNAFU literal and dynamically derives `decimal`, `canonical`, `digitCount`, and MSB-to-LSB `digitTerms`.
  - `parseFuelLedger` / `SnafuLedger` parse newline-delimited fuel ledgers and derive `count`, `maxLength`, `totalDecimal`, and `totalSnafu`.
  - `traceFuelLedger` produces a bounded sequence of `AccumulateFrame` and `EncodeStepFrame` snapshots for interactive visualization.

## Maintainer Guide

- Module DAG (acyclic): `snafu` -> `ledger` -> `trace` -> `index`.
- **Single Source of Truth**: Domain entities store only validated raw state (`text`, `entries`, frame step inputs) and compute all decimal sums, carries, digits, and place-value terms via dynamic getters.
- **Exact Signed Encoding**: `encodeSnafu` and `EncodeStepFrame` use `floorDiv(remaining + 2n, 5n)` / `floorDiv(remaining, 5n)` so positive, zero, and negative `bigint` totals encode uniformly without overflow.
- **Bounded Trace Sampling**: `traceFuelLedger` reserves steps for the full encode cascade whenever `maxSteps > encodeFrames.length` and uniformly samples `encodeFrames` when `maxSteps <= encodeFrames.length`.
