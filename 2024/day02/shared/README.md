# `2024/day02/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2024 Day 2 ("Red-Nosed Reports").

### Public API (`2024/day02/shared/index.ts`)
- `MIN_SAFE_STEP`, `MAX_SAFE_STEP`, `TrendDirection`, `StepViolationReason`
- `assertSafeInt(value, label)`, `isSafeStep(prev, next, expectedDirection)`, `classifyStepViolation(prev, next, expectedDirection)`
- `StepFailure`: frozen value object recording `index`, `prev`, `next`, `reason`, and dynamic `delta`.
- `Report`: frozen value object holding safe-integer `levels`, dynamic `length`, `trend`, `firstFailure()`, and `isSafe`.
- `parseReports(raw)`: parses multi-line whitespace-separated integer reports (`LF` or `CRLF`) with outer trimming and 1-based line-numbered error reporting.

## Maintainer Guide
- **Pure domain**: zero DOM/React/Node dependencies; immutable frozen value objects with no stored derived state.
- **Invariants**: `Report` defensively copies and normalizes `-0` to `+0`. `firstFailure()` scans from index `0` so an initial step exceeding `MAX_SAFE_STEP` is still detected and classified as `'jump'`.
