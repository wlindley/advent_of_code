# 2020 Day 20 Shared Domain

## User Guide
Pure TypeScript domain package for AoC 2020 Day 20 (*Jurassic Jigsaw*).
Instantiate `new JigsawSolver(CORNER_PRODUCT_POLICY)` for Part 1 or
`new JigsawSolver(WATER_ROUGHNESS_POLICY)` for Part 2 via `./index.ts`.

## Developer Architecture
- `d4.ts`: Dihedral group D4 pullback indexing, sign-safe bit reversal, `SquareBitmap`.
- `tile.ts` & `parser.ts`: Tile validation and precomputed 8-orientation edge bitmasks.
- `assembler.ts`: `Map`-indexed pruned DFS jigsaw assembly (`AssembledGrid`).
- `monsters.ts`: Sea monster pattern scanner across all 8 D4 orientations (`SeaMonsterScan`).
- `policies.ts`, `trace.ts`, `solver.ts`: Polymorphic `JigsawPolicy` and bounded trace frames.
