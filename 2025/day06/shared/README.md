# `2025/day06/shared`

## Consumer Guide
Shared pure-TypeScript worksheet parser and domain model for Advent of Code 2025 Day 6 ("Trash Compactor").

### Public API (`2025/day06/shared/index.ts`)
- `WorksheetOperator`: `'+' | '*'`.
- `ProblemBlock`: immutable column-span problem block (`startCol`, `endCol`, `operator`, `digitRows`, derived `width` getter, `evaluate(operands)` with `bigint` arithmetic).
- `Worksheet`: frozen `{ blocks: readonly ProblemBlock[], width: number }`.
- `parseWorksheet(raw)`: splits on `/\r?\n/`, strips only outer blank lines (preserving column indentation), right-pads ragged lines, and segments contiguous non-blank columns into `ProblemBlock` instances.

## Maintainer Guide
- **Indentation Preservation**: Never trim `raw` or individual content lines; leading spaces on row 0 are significant column positions for both horizontal (Part 1) and vertical (Part 2) digit extraction.
- **Validation**: `ProblemBlock` enforces integer column bounds, valid operators, uniform row width matching `[ 0-9]+`, and at least one digit so downstream operand extractors can rely on non-empty inputs.
