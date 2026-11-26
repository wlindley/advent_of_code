# 2022 Day 22 Shared Domain — Monkey Map

## Consumer Guide

- `index.ts` exports pure TypeScript domain primitives for Monkey Map Part 1 and Part 2:
  - `parseMonkeyMap(raw)` parses the grid and instruction path into `{ board, path }`.
  - `FlatTorusTopology(board)` implements Part 1 row/column wrap-around stepping.
  - `CubeNetTopology(board)` implements Part 2 3D folded cube-net seam stepping.
  - `walkMonkeyMap(input, topology)` and `traceMonkeyMap(input, topology, options)` execute and trace paths, returning `Pose` / `MonkeyMapTraceFrame[]`.
  - `computePassword(pose)` computes `1000 * (row + 1) + 4 * (col + 1) + facing`.

## Maintainer Guide

- Module DAG (acyclic): `types` -> `board` -> `parser` & `flatTorusTopology` & `cubeFrame` -> `cubeNetTopology` -> `walker` -> `index`.
- **Leading spaces invariant**: `parseMonkeyMap` never calls `.trim()` or `.trimStart()` so row-0 column offsets are preserved.
- **Flat-torus wrap invariant**: `FlatTorusTopology.step` scans backward by `(-dr, -dc)` on void hits, preserving involution without storing derived span bounds.
- **Cube-net folding invariant**: `CubeNetTopology` validates `6 * S^2` playable tiles, aligned `S x S` blocks, BFS connectivity (`6` faces), and `6` distinct outward normals with `r x d = n`.
- **Wall-before-commit invariant**: `walker.ts` checks `Tile.Wall` before updating pose so seam-blocked steps preserve pre-wrap facing.
