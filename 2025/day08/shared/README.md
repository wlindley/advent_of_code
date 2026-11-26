# `2025/day08/shared`

## Consumer Guide
Shared pure-TypeScript 3D junction coordinate parser, distance metric, and pair comparator for Advent of Code 2025 Day 8 ("Playground").

### Public API (`2025/day08/shared/index.ts`)
- `Point3D`: immutable `{ x, y, z }` integer coordinate tuple.
- `JunctionPair`: immutable undirected index pair `{ u, v, distSq }`.
- `parseJunctions(raw)`: parses `x,y,z` lines into a frozen array of frozen `Point3D` objects.
- `squaredDistance3D(a, b)`: exact squared Euclidean distance with `Number.isSafeInteger` overflow guard.
- `compareJunctionPairs(a, b)`: deterministic ascending order by `(distSq, u, v)`.

## Maintainer Guide
- **Immutability & Determinism**: `parseJunctions` normalizes `-0` to `0`, freezes points and array, and enforces strict integer tokens without internal whitespace so downstream solvers operate on clean numeric coordinates.
- **Exact Metric**: Squared distances stay exact within IEEE-754 safe integer bounds, avoiding `Math.sqrt` floating-point rounding ambiguity.
