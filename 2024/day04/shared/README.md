# `2024/day04/shared` — Word Search Grid

## Consumer Guide
Shared immutable grid parser and ray-matching primitive for Advent of Code 2024 Day 4.

- `parseWordSearch(raw)`: parses LF/CRLF rectangular grids of `A-Z` and `.` into a frozen `WordSearchGrid`.
- `WordSearchGrid`: exposes `rows`, `cols`, `size`, `inBounds(row, col)`, `at(row, col)`, and `matchesAt(row, col, dr, dc, word)`.

## Maintainer Guide
- Backed by `Grid2D<string>` from `shared/core` so rectangular geometry and bounds checks stay DRY.
- Constructor eagerly validates every cell (`A-Z` or `.`), making invalid states impossible for Part 1 and Part 2 solvers.
- `matchesAt` validates non-empty `word` and non-zero integer `(dr, dc)` deltas, then uses an $O(1)$ endpoint bounds check before inspecting characters.
