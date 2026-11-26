# `2022/day03/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2022 Day 3 ("Rucksack Reorganization").

### Public API (`2022/day03/shared/index.ts`)
- `PRIORITY_COUNT`, `itemPriority`, `priorityToItem`, `encodeItemMask`, `extractSinglePriority`: 52-bit BigInt item bitmask encoding (`a..z` -> `1..26`, `A..Z` -> `27..52`) and single-bit priority extraction via `bigintLog2`.
- `Rucksack`, `validateRucksackRaw`, `parseRucksacks`: parses `LF`/`CRLF` rucksack lines (skipping blank lines, reporting 1-based physical `Line N` errors) into immutable frozen `Rucksack` value objects with dynamic compartment/bitmask getters.
- `PriorityTally`, `DEFAULT_MAX_TRACE_STEPS`: immutable 52-slot item-priority frequency snapshot with dynamic `totalItems`, `totalPriority`, `distinctTypes`, `maxCount`, and `countOf(priority)`.

## Maintainer Guide
- **Pure domain**: depends only on `shared/core` (`bigintLog2`); zero DOM/React/Node dependencies.
- **Invariants**: `Rucksack` stores only `rucksackNumber` and `raw` without enforcing unique compartment overlap on construction so Part 2 multi-rucksack groups construct cleanly; `PriorityTally` copies and validates its 52-slot `counts` array defensively on construction.
