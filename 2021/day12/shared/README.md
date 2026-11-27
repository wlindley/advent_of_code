# 2021 Day 12 Shared Domain (`2021/day12/shared`)

Pure TypeScript domain model, parser, visit policies, big-cave contraction DP solver, trace capturer, layered SVG layout engine, and shared React visualizers for Advent of Code 2021 Day 12 ("Passage Pathing").

## Consumer Guide

Import pure domain symbols from `2021/day12/shared`:

```ts
import {
  CavePathSolver,
  NO_REVISIT_POLICY,
  SINGLE_SMALL_REVISIT_POLICY,
} from '../../shared';

const solver = new CavePathSolver(NO_REVISIT_POLICY);
const system = solver.parse(rawInput);
const totalPaths = solver.solve(system); // bigint
const frames = solver.trace(system, { maxSteps: 120 });
```

Import UI visualization components directly from `2021/day12/shared/viz/*` (never re-exported from `shared/index.ts` to keep the domain barrel free of React/DOM imports).

## Maintainer Architecture

- **`cave.ts`**: Immutable `CaveSystem` value object (`Map`/`Set` prototype-safe adjacency), `classifyCave`, and `findRevisitedSmallCave` (single source of truth for deriving any revisited small cave from a path). Validates alpha-case purity, no self-loops, no duplicate undirected edges, no big-big edges, and presence of `start` and `end`.
- **`parser.ts`**: Validates non-empty trimmed input and exact two-segment `a-b` lines before constructing `CaveSystem`.
- **`policy.ts`**: `CaveVisitPolicy` strategy interface and `FixedRevisitPolicy` (`NO_REVISIT_POLICY` for Part 1, `SINGLE_SMALL_REVISIT_POLICY` for Part 2).
- **`contract.ts`**: Contracts big caves into weighted transitions among `start`, regular small caves, and `end`, iterating all ordered neighbor pairs `(u, v)` around each big cave including `u === v` so degree-1 big caves produce self-loop weights.
- **`solver.ts`**: `CavePathSolver` using `BigInt` visited bitmasks (supports >31 small caves) and `BigInt` DP memoization over `(currentSmallIndex, revisitBudget, visitedMask)`.
- **`trace.ts`**: Bounded raw-graph DFS trace capturer reserving 1 slot for the terminal `'summary'` frame (`dfsBudget = limit - 1`).
- **`layout.ts`**: Deterministic BFS-layered layout with overflow column for unreachable intermediates and quadratic Bezier curving for same-column and colinear skip edges.
