# 2021 Day 23 Part 2 — Amphipod

## Consumer Usage

- **Domain entrypoint**: [`domain/index.ts`](./domain/index.ts) exports `solver`, `UnfoldedBurrowPolicy`, and `UNFOLDED_BURROW_POLICY` (room depth 4).
- **Manifest**: [`index.ts`](./index.ts) exports `manifest` for the interactive web registry and verification against the official example (`44169`).
- **CLI execution**: `npm run aoc -- run 2021 23 2`.

## Maintainer Notes

Part 2 implements `UnfoldedBurrowPolicy` in [`domain/policy.ts`](./domain/policy.ts) to insert the canonical middle pairs (`DD`, `CB`, `BA`, `AC`) into each side room, delegating parsing, move pruning, A* search, trace sampling, and depth-aware SVG visualization to `../../shared`.
