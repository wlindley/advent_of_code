# 2023 Day 02 Shared Domain (`CubeBag`, `GameRecord`, `parser`)

## Consumer Guide

- **`CUBE_COLORS` / `CubeColor` / `isCubeColor`**: Canonical `['red', 'green', 'blue']` tuple and type guard.
- **`CubeBag`**: Immutable, frozen RGB cube count tuple (`CubeBag.EMPTY`, `.power`, `.fitsWithin(limits)`, `.maxWith(other)`, `.exceededColors(limits)`).
- **`GameRecord`**: Immutable, frozen game entity with positive safe integer `id` and non-empty frozen `reveals` (`CubeBag[]`). Exposes dynamic `.minimumBag` and `.isPossibleWith(limits)`.
- **`parseGameLine` / `parseGames`**: Strict line and multiline parsers producing frozen `GameRecord` structures and throwing `SyntaxError` / `RangeError` on malformed inputs.

## Maintainer Guide

- All value objects are frozen at construction and compute derived quantities (`power`, `minimumBag`) dynamically so no derived state can drift.
- Validation is partitioned cleanly without duplication: `parser.ts` validates textual syntax and duplicate colors within a reveal; `CubeBag` and `GameRecord` constructors enforce numeric safe-integer bounds and non-empty reveals.
- All helpers are top-level functions `< 30 LoC` with zero UI dependencies.
