# 2023 Day 04 Shared Domain (`Scratchcard`, `parser`)

## Consumer Guide

- **`MAX_SAFE_MATCH_COUNT`**: Constant `53`, the largest match count whose doubling point value `2^(k - 1)` fits in IEEE-754 safe integers.
- **`Scratchcard`**: Immutable, frozen value object storing `id`, `winningNumbers`, and `ownedNumbers`, with dynamic getters `matchingNumbers` (frozen, owned-list order), `matchCount`, and `points`.
- **`assertCardId` / `assertNumberList`**: Top-level boundary validators throwing `RangeError` on non-positive IDs, empty lists, or non-safe/negative integers.
- **`parseNumberList` / `parseScratchcard` / `parseScratchcards`**: Strict parsers for column-aligned whitespace and LF/CRLF multiline inputs, returning frozen `Scratchcard` records or throwing `SyntaxError` / `RangeError`.

## Maintainer Guide

- Derived values (`matchingNumbers`, `matchCount`, `points`) are computed dynamically on `Scratchcard` so no stored derived state can drift out of sync.
- `points` uses `2 ** (k - 1)` rather than `1 << (k - 1)` to avoid 32-bit signed bitwise overflow for `k >= 32`, and rejects `k > 53` with `RangeError`.
- All validators and parser helpers are top-level functions under 30 LoC with zero UI dependencies.
