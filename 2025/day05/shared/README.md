# `2025/day05/shared`

## Consumer Guide
Shared pure-TypeScript ingredient database parser and model for Advent of Code 2025 Day 5 ("Cafeteria").

### Public API (`2025/day05/shared/index.ts`)
- `IngredientDatabase`: frozen `{ freshRanges: readonly ClosedInterval[], availableIds: readonly bigint[] }`.
- `parseDatabase(raw)`: normalizes CRLF, validates the two blank-line-separated sections, and parses arbitrary-precision `bigint` ranges and IDs.

## Maintainer Guide
- **BigInt Precision**: Range endpoints and ingredient IDs are parsed directly via `BigInt(...)` and `ClosedInterval` so inputs exceeding `Number.MAX_SAFE_INTEGER` (15+ digits) never lose precision.
- **Strict Section Boundary**: Splitting on `/\n[ \t]*\n/` after outer trimming ensures empty inputs, missing blank-line separators, and accidental extra blank-line sections fail fast with contextual errors.
