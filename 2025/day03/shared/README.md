# `2025/day03/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2025 Day 3 ("Lobby").

### Public API (`2025/day03/shared/index.ts`)
- `BatteryBank`: frozen validated digit string (`'1'..'9'`) with `length` and `selectMaxJoltage(count)`.
- `JoltageSelection`: frozen, strictly increasing index selection over a `BatteryBank` with derived `count`, `digits`, and `BigInt` `joltage`.
- `parseBatteryBanks(raw)`: parses newline-delimited battery banks (LF/CRLF) with outer trimming and 1-based `Line N:` error context.

## Maintainer Guide
- **Pure domain**: zero DOM/React/Node dependencies; `JoltageSelection.joltage` uses `bigint` so arbitrarily wide selections never lose precision.
- **Tie-breaking & Invariants**: `selectMaxJoltage(count)` uses an `O(L)` monotonic non-increasing index stack with strict `>` comparisons so equal-value ties deterministically prefer the earliest cell indices. Both classes freeze themselves and store zero derived state.
