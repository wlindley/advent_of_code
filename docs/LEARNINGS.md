# Advent of Code — Learnings & Playbook

Reusable algorithmic patterns, parsing idioms, performance tricks, and AoC pitfalls accumulated across solved puzzles. Consult this file during puzzle analysis and design review before implementing each new part.

## Promoted Shared Utilities (`shared/core/`)
- `solver.ts` — `PuzzleSolver`, `executeSolver`, `Clock` contract for deterministic timing & tracing.
- `math.ts` — `euclideanMod(dividend, divisor)` with safe-integer validation and `-0` normalization (added in 2025 Day 1 Part 1).
- `grid.ts` — immutable `Grid2D<T>`, `DIRS_4`, `DIRS_8` preserving meaningful spaces by stripping only trailing line endings (added in 2025 Day 4 Part 1).
- `interval.ts` — immutable `BigInt` `ClosedInterval` and canonical `IntervalUnion` (coalesces overlapping & integer-adjacent ranges, exposes `findContaining`, `contains`, `totalLength`; added in 2025 Day 5 Part 1).
- `disjointSet.ts` — `Int32Array`-backed `DisjointSet` (Union-Find with iterative path compression, union-by-size in negative root slots, `componentCount`, `componentSizes`; added in 2025 Day 8 Part 1).
- `gf2.ts` — arbitrary-width `BigInt` `Gf2LinearSystem` (full Gauss-Jordan RREF, consistency check, nullspace basis, Gray-code `minWeightSolution`) and `bitCount` (added in 2025 Day 10 Part 1).
- `rational.ts` — immutable `BigInt` `Rational` value object plus `gcdBigInt`, `lcmBigInt`, `floorDiv`, and `ceilDiv` for exact rational elimination and integer-inequality bound propagation (added in 2025 Day 10 Part 2).
- `dag.ts` — generic immutable `DirectedGraph<T>` with `relevantSubgraph`, iterative Kahn `topologicalOrder`, and `BigInt` `countPaths` with R-scoped cycle detection (added in 2025 Day 11 Part 1).

## Algorithmic Patterns & Scaling Traps
- **Preserve raw magnitudes when parsing Part 1** (2025 Day 1): Example inputs often use small numbers (`< 100`) while personal inputs include multi-revolution/large values (`up to 998`); preserve unreduced values in `<year>/dayNN/shared/` so Part 2 can reuse the exact parser without churn.
- **Avoid single-wrap conditionals on modular arithmetic**: Always use `euclideanMod` with pre-reduced step size (`distance % M`) so arbitrarily large safe integers never overflow or produce negative remainders.
- **Differential testing against simple brute-force oracles** (2025 Day 1 Part 2): Whenever a closed-form `O(1)` formula replaces step-by-step simulation (such as circular crossing counts with `p = 0` left/right asymmetry), add a test-only brute-force oracle across all boundary states to guarantee zero off-by-one bugs before submitting to AoC.
- **Möbius inclusion-exclusion over periodic/divisibility classes** (2025 Day 2 Part 2): Expanding non-empty subsets of distinct prime factors with alternating sign `-μ(r)` yields exact closed-form counts and sums across multi-periodic structures without materializing sets.
- **Monotonic stack for maximum length-`k` subsequence** (2025 Day 3): Maintain a non-increasing stack with discard budget `L - k` and strict `>` pop condition (`O(L)` independent of `k`, earliest-index deterministic), parameterizing `k` in `dayNN/shared/` with `BigInt` totals so Part 2 scales effortlessly.
- **Zero-padded flat grids & synchronous `k`-core peeling** (2025 Day 4): Embedding a 2D grid in a 1-cell zero-padded `Uint8Array` eliminates inner bounds checks and row-wrap bugs; during wave peeling, claim cells immediately when crossing `< k` to prevent duplicate enqueues while keeping waves strictly synchronous, and store per-cell `Uint32Array` wave indices for zero-copy `<canvas>` contour playback.
- **Dense Prim's MST for bottleneck / final-bridge edges** (2025 Day 8 Part 2): On complete Euclidean graphs (`N ~ 1000`), dense `O(N^2)` Prim's MST in `O(N)` typed arrays finds the exact Kruskal bottleneck edge without allocating `N(N-1)/2` pairs; apply canonical `(distSq, min(a,b), max(a,b))` tie-breaking in both relaxation and selection, and verify against an independent full-sort Kruskal oracle.
- **Unclamped Monge D&C on Pareto staircases** (2025 Day 9 Part 1): When maximizing `(X_j - x_i + 1)(Y_j - y_i + 1)` across opposite Pareto frontiers extracted from the same point set, evaluate the raw unclamped polynomial (never clamping invalid pairs to 0 or filtering `i === j` inside `bestJ`) so strict quadrangle monotonicity holds globally and runs in worst-case `O(N log N)`.
- **Point+Gap coordinate compression + half-open vertical parity** (2025 Day 9 Part 2): For orthogonal polygon tile-inclusion queries on large coordinates, build point+gap slabs (omitting gaps when `u_{i+1} - u_i === 1n`), mark inclusive boundaries, sweep half-open vertical parity (`cyLo <= cy < cyHi`), and fuse a 1-based 2D `Int32Array` invalid-cell prefix sum for `O(1)` branch-free rectangle queries immune to 0-gap pinches and bottleneck exterior cavities.
- **Bitmask DAG DP + R-scoped cycle detection** (2025 Day 11): Pruning `Backward(target)` strictly inside `Forward(source)` scopes cycle checks to `R` without false positives on off-path cycles; propagating frozen `2^K`-state `BigInt` distributions in topological order handles arbitrary waypoint orders, coincident endpoints, and parallel multiedges in `O(2^K (V + E))`.

## Parsing & Numeric Pitfalls
- Always check whether puzzle answers can exceed `Number.MAX_SAFE_INTEGER` (`2^53 - 1`); use `BigInt` whenever totals/products can grow super-linearly.
- **Exact `BigInt` ceiling/floor division** (2025 Day 2): For positive `L, M`, `(L + M - 1n) / M` is exact `ceil(L / M)` and `U / M` is exact `floor(U / M)`; when mapping `BigInt` ranges to SVG coordinates, scale `(val - lo) * 1000n / span` in `BigInt` before converting to `Number`.
- **Safe `BigInt` log2 scaling for heatmaps** (2025 Day 7 Part 2): Never call `Math.log2(Number(big))` (overflows past `2^1024`); compute `Math.log2(parseInt(bits.slice(0, 53), 2)) + (bits.length - topLen)` and use `-1` (never `0`, which is `log2(1n)`) as the unvisited sentinel.
- Trim trailing newlines cleanly without stripping meaningful leading/trailing spaces on grid or ASCII-art inputs.
- **Space-preserving column segmentation** (2025 Day 6): On column-aligned ASCII worksheets, strip only outer blank lines, right-pad shorter lines to `maxWidth`, and store raw fixed-width slices per block so Part 2 can switch reading orientation (e.g., right-to-left vertical columns) with zero parser churn.

## Visualization & Runtime Notes
- Keep `domain/` 100% pure (zero DOM/React imports) and emit compact, bounded trace snapshots so large personal inputs never freeze the UI.
- Escalation ladder: main thread → Web Worker (> ~500 ms or embarrassingly parallel) → local Rust CLI (only if optimized TS/Workers would exceed 5 minutes or browser memory limits).

## Future Scaling Notes
- **Multi-year parallelism (post-2025)**: After completing 2025, prior years can be tackled **2–3 years in parallel** (e.g., isolated worktrees/branches per year merged into `main`, with `site/data/status.json` updates merged cleanly and AoC submissions serialized around `.aoc-cache/rate-limit.json`). When reaching 2022, archive the existing `2022/` Rust solutions to `archive/2022-rust/` first.
