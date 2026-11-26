# `2024/day05/shared` — Print Queue Model & Parser

## Consumer Guide
Shared immutable domain model and parser for Advent of Code 2024 Day 5.

- `parsePrintQueue(raw)`: parses LF/CRLF `before|after` rule and comma-separated update sections into a frozen `PrintQueue`.
- `PageOrderRule` / `ApplicableRule` / `PageOrderRules`: frozen pairwise ordering rules, order validation (`isValidOrder`), per-update rule inspection (`applicableRules`), and induced `DirectedGraph<number>` construction (`inducedGraph`).
- `PrintUpdate`: frozen non-empty, odd-length sequence of distinct positive page numbers with dynamic `middlePage`.

## Maintainer Guide
- `rules.ts` keeps `assertPageNumber` and `assertIndex` internal to `shared` (not re-exported from `index.ts`).
- `queue.ts` delegates numeric and domain invariants directly to `PageOrderRule` and `PrintUpdate` constructors so validation lives in a single place.
- `inducedGraph` deduplicates page lists and adapts `DirectedGraph` from `shared/core` using top-level helpers without nested closures.
