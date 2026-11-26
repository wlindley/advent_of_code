# 2023 Day 05 Shared Domain (`RangeRule`, `RangeMap`, `Almanac`, `parser`)

## Consumer Guide

- **`assertNonNegativeBigInt`**: Boundary validator rejecting negative `bigint` values with `RangeError`.
- **`RangeRule`**: Immutable value object storing `source: ClosedInterval` and `destStart: bigint`. Construct via `RangeRule.fromTriple(destStart, sourceStart, length)` (note `destStart` precedes `sourceStart` in AoC input). Exposes dynamic getters `delta` and `destination`, plus `apply(value)`.
- **`RangeMap`**: Immutable, sorted, non-overlapping collection of `RangeRule`s between `sourceCategory` and `destCategory`. Provides `findRule(value)` (binary search) and `mapValue(value)` (identity fallback when unmatched).
- **`Almanac`**: Immutable validated list of `seeds` and contiguous chain of `RangeMap`s, exposing dynamic `categories`.
- **`parseSeedsLine` / `parseRuleLine` / `parseMapSection` / `parseAlmanac`**: Strict LF/CRLF parsers throwing `SyntaxError` on malformed syntax and `RangeError` on invalid bounds, overlaps, or broken chains.

## Maintainer Guide

- All arithmetic uses arbitrary-precision `bigint` and `ClosedInterval` from `shared/core` to support values beyond `Number.MAX_SAFE_INTEGER`.
- Sorting uses an explicit `< / > / 0` comparator (`compareRulesBySourceStart`) because `bigint` subtraction is invalid as an `Array.prototype.sort` return value.
- Derived properties (`delta`, `destination`, `categories`) are computed dynamically without stored derived state.
