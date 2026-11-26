# `2024/day01/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2024 Day 1 ("Historian Hysteria").

### Public API (`2024/day01/shared/index.ts`)
- `LocationLists`: frozen value object holding equal-length `left` and `right` safe-integer arrays, with `size` and `isEmpty` getters.
- `parseLocationLists(raw)`: parses multi-line whitespace-separated integer pairs (`LF` or `CRLF`) with outer trimming and 1-based line-numbered `Error` / `RangeError` reporting.

## Maintainer Guide
- **Pure domain**: zero DOM/React/Node dependencies.
- **Invariants**: `LocationLists` defensively copies, normalizes `-0` to `0`, validates `left.length === right.length` and `Number.isSafeInteger` for every element, and freezes both column arrays and the instance. Empty `([], [])` is valid at the value-object boundary, while `parseLocationLists` requires at least one row.
