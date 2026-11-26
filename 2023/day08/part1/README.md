# 2023 Day 08 Part 1 — Haunted Wasteland

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `START_LABEL`, `TARGET_LABEL`, `solveHauntedWastelandPart1`, `traceHauntedWastelandPart1`, and `solver` (`parse`, `solve`, `trace`) backed by [../../shared](../../shared/index.ts).
- **Site manifest** ([index.ts](index.ts)): registers puzzle metadata, 3-node `LLR` example (`exampleAnswer: '6'`), `solver`, and `Visualizer`.

## Maintainer Guide

- `solveHauntedWastelandPart1` requires both `AAA` and `ZZZ` upfront and delegates to `WastelandNetwork.findFirstTarget` with `(node, ip)` cycle detection.
- `Visualizer` is a thin wrapper around `WastelandVisualizer`, rendering a cyclic `TapeRibbon` and switching between `FullNetworkSvg` (`<= 20` nodes) and `LocalDecisionHubSvg` (`> 20` nodes).
