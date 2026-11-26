# 2023 Day 07 Part 1 — Camel Cards

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `standardHandRule`, `solveCamelCardsPart1`, `traceCamelCardsPart1`, and `solver` (`parse`, `solve`, `trace`) backed by [../../shared](../../shared/index.ts).
- **Site manifest** ([index.ts](index.ts)): registers puzzle metadata, 5-hand example (`exampleAnswer: '6440'`), `solver`, and `Visualizer`.

## Maintainer Guide

- `standardHandRule` implements `CamelHandRule` with `2..A` card strengths (`0..12`), `wildLabel: null`, and descending card-frequency signature classification.
- `Visualizer` is a thin wrapper around `CamelCardsVisualizer` so Part 2 can swap in a joker-aware `CamelHandRule` while reusing the exact same interactive UI.
