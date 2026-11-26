# AoC 2023 Day 25 — Shared Graph & Min-Cut Domain

## Consumer Guide

- `parseWiringGraph(raw)`: parses `component: neighbor ...` lines into an immutable `WiringGraph` with lexicographically sorted labels, deduplicated undirected edges (`u < v`), and flat forward-star TypedArrays.
- `findThreeEdgeCut(graph)`: verifies `minDegree >= 3` and connectivity, scans vertices in reverse BFS order from vertex `0` using unit-capacity Edmonds-Karp capped at 4 augmenting paths, and returns a frozen `MinCutResult` (`sideS`, `sideT`, `cutEdges`, `disjointPaths`, `probes`, and dynamic `sizeS`, `sizeT`, `product`, `probesRun`).
- `buildMinCutTrace(graph, options?)`: builds a bounded (`DEFAULT_MAX_TRACE_STEPS = 48`) trace with a shared deterministic bipartite chasm `GraphLayout` (`S` in `x in [0.05, 0.40]`, `T` in `x in [0.60, 0.95]`, cut-wire rim endpoints at `0.39` / `0.61`).
- `viz/SnowverloadVisualizer.tsx` & `viz/SnowverloadCanvas.tsx`: interactive HiDPI canvas visualizer powered by `PlaybackControls`.

## Maintainer Architecture

- `wiringGraph.ts` -> `minCut.ts` -> `flowDecomposition.ts` -> `edmondsKarp.ts` -> `minCutTrace.ts` -> `index.ts` (strictly acyclic DAG, zero React/DOM imports).
- Forward-star arrays (`head`, `to`, `next`) and residual `cap` arrays are kept mutable/unfrozen internally (`he ^ 1` reverse half-edge) and never passed to `Object.freeze()`.
- `viz/` contains `.tsx` presentation components only and imports exclusively from `../index` and `shared/viz`.
