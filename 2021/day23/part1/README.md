# 2021 Day 23 Part 1 — Amphipod

## Consumer Usage

- **Domain entrypoint**: [`domain/index.ts`](./domain/index.ts) exports `solver` configured with `STANDARD_BURROW_POLICY` (room depth 2).
- **Manifest**: [`index.ts`](./index.ts) exports `manifest` for the interactive web registry and verification against the official example (`12521`).
- **CLI execution**: `npm run aoc -- run 2021 23 1`.

## Maintainer Notes

Part 1 is a thin configuration layer delegating all parsing, move pruning, A* search, trace sampling, and SVG visualization to `../../shared`.
