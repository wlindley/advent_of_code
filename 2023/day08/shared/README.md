# 2023 Day 08 Shared Haunted Wasteland Domain & Visualizer

## Consumer Guide

- **Domain barrel** ([index.ts](index.ts)): pure TypeScript exports for `WastelandNetwork`, `parseWastelandNetwork` (`parseTape`, `parseNodeLine`), and `WastelandTraceFrame` / `traceNetworkWalk`.
- **Reusable visualizer** ([viz/WastelandVisualizer.tsx](viz/WastelandVisualizer.tsx)): renders any `PuzzleSolver<WastelandNetwork, number, WastelandTraceFrame>` with a cyclic instruction tape ribbon and dual-scale graph/hub SVG view.

## Maintainer Guide

- `WastelandNetwork` packs turns into `Uint8Array` and directed edges into `Int32Array` indices with `Uint8Array(nodeCount * tapeLength)` `(node, ip)` cycle detection.
- `WastelandTraceFrame` stores only `(network, step, totalSteps, recentPath)` and derives all display fields dynamically via getters with transition validation.
- `shared/index.ts` intentionally excludes `.tsx` modules so Node/CLI runners never import React or DOM types.
