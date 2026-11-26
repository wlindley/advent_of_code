# AoC 2024 Day 22 Part 2 — Monkey Market

## User / Consumer Documentation
Finds the single 4-delta price-change sequence (`[-9..9]^4`) that maximizes total bananas obtained when each buyer sells on their first matching window over 2,000 PRNG steps.

### Entrypoints
- **Domain solver (`./domain/solver.ts`)**:
  - `PART2_STEPS`: `2_000`.
  - `PART2_LEADERBOARD_SIZE`: `10`.
  - `solvePart2(seeds)`: returns maximum total bananas across `seeds`.
  - `solver`: `PuzzleSolver<readonly number[], number, MarketSnapshot>` for CLI and manifest execution.
- **Site manifest (`./index.ts`)**: exports `manifest: PuzzlePartManifest` with `MonkeyMarketPart2Visualizer` and `exampleAnswer: '23'`.

## Developer / Maintainer Documentation
- Delegates parsing, base-19 delta-key encoding, buyer stamp-table scanning, top-K ranking, and bounded snapshot trace generation to `../shared/`.
- `part2/domain/` contains zero React/DOM imports and zero default parameter values, preserving a strict one-way DAG (`shared/core` -> `day22/shared` -> `part2/domain` -> `part2/viz` -> `part2/index.ts`) with 100% V8 coverage.
