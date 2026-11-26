# Advent of Code — Learnings & Playbook

High-signal engineering, algorithmic, testing, and visualization rules distilled from **2025, 2024, 2023, and 2022 (146/146 consecutive first-try stars, 0 wrong submissions, 100% V8 coverage)**. Consult during puzzle analysis and design review before coding each part.

---

## 1. Shared Primitives Inventory (`shared/core/` & `shared/viz/`)

Check here before writing day-local helpers. During parallel year worktrees, treat `shared/` as **read-only**; build day-local utilities in `<YYYY>/dayNN/shared/` and flag promotion candidates for the end-of-year barrier.

### `shared/core/` (Pure TS, Node + Browser + Worker safe)
- **`solver.ts`**: `PuzzleSolver`, `executeSolver`, `createFinaleSolver`, `formatDayFolder`, `formatPartKey`, `Clock`, `systemClock`.
- **`math.ts`**: `euclideanMod` (safe-int, `-0`-free), `bigintLog2` (top-53-bit exact log2 past `2^1024`), `bigintIsqrt` (exact floor `√n`), `extGcdBigInt`, `solveCongruences` (generalized `BigInt` CRT).
- **`rational.ts`**: immutable `BigInt` `Rational`, `gcdBigInt`, `lcmBigInt`, `floorDiv`, `ceilDiv`.
- **`interval.ts`**: immutable `BigInt` `ClosedInterval` and `IntervalUnion` (`contains`, `findContaining`, `totalLength`). *Trap*: `IntervalUnion` coalesces integer-adjacent ranges (`[2,3] ∪ [4,5]`), so use `ClosedInterval` directly for pairwise overlap/containment checks.
- **`grid.ts`**: immutable `Grid2D<T>`, `DIRS_4`, `DIRS_8`, `GridDelta` (preserves significant spaces by stripping only trailing line endings).
- **`disjointSet.ts`**: `Int32Array`-backed `DisjointSet` (iterative path compression, union-by-size, `componentCount`, `componentSizes`).
- **`dag.ts`**: immutable `DirectedGraph<T>` (`relevantSubgraph`, iterative Kahn `topologicalOrder`, `BigInt` `countPaths` with R-scoped cycle detection).
- **`gf2.ts`**: arbitrary-width `BigInt` `Gf2LinearSystem` (Gauss-Jordan RREF, nullspace basis, Gray-code `minWeightSolution`) and `bitCount`.
- **`trace.ts`**: `validateMaxSteps`, `sampleTraceIndices` (endpoint-preserving uniform sampling).

### `shared/viz/` (React UI primitives)
- **`InputRunner`**, **`PlaybackControls`**, **`usePlayback`**, **`PuzzlePartManifest`**, **`VisualizerProps`**.

---

## 2. Zero-Churn Part 2 Architecture (`<YYYY>/dayNN/shared/`)

- **Preserve raw fidelity when parsing Part 1**: Keep unreduced magnitudes, raw tokens/columns, alphanumeric labels, and significant leading/trailing whitespace (never `.trim()` ASCII drawings or column worksheets; strip only trailing newlines / outer blank lines).
- **Design for the Part 2 axis of change**: Parameterize counts (`k`, window width, step/blink/unfold factor, `BigInt` offsets) and pluggable behaviors via narrow polymorphic interfaces (rule, strategy, operator, topology, decoder, metric) or factory helpers in `dayNN/shared/`. Prefer polymorphic dispatch or total `Record<Kind, ...>` maps over type-tag `switch` chains.
- **Zero cross-part coupling**: Enforce the strict one-way DAG (`shared/core` → `dayNN/shared` → `partP/domain` → `partP/viz` → `site/`). Never import `part1/` from `part2/`.
- **Single source of truth**: Keep domain entities immutable (`Object.freeze`) and compute derived values (totals, counts, bounds, masks, ratios) via getters so state never drifts.
- **Structural validation at the right boundary**: Keep `dayNN/shared/` entity validation structural (not Part-1-rule-specific) so Part 2 can reuse the same models. Always validate all referenced node/workflow targets *before* building a `DirectedGraph` so undefined targets aren't auto-synthesized as sinks.

---

## 3. Exact Math, Bitwise & Geometry Traps

- **Default to `BigInt` / `Rational` whenever values can grow super-linearly**: Guard against both `Number.MAX_SAFE_INTEGER` (`2^53 - 1`) and `BigInt64Array` (`2^63 - 1`). Convert operands to `BigInt` *before* multiplying (`BigInt(a) * BigInt(b)`).
- **Signed division & modulo**: JS `/` truncates toward zero and `%` retains negative signs. Always use `floorDiv`/`ceilDiv` for signed `BigInt` division (e.g., negative balanced-base encoding, odd-parity lattice pinches `(s + d - 1n) / 2n`) and `euclideanMod` with pre-reduced step `(steps % M)`. Negate integer coordinates with `0 - x` to prevent `-0` without branches.
- **Exact linear algebra & geometry**:
  - Normalize 2D cross-product determinants to `d > 0n` so ray/box sign checks stay branch-clean in exact `BigInt`.
  - Use shifted integer discriminants (`Δ' = T^2 - 4(D + 1)`) with `bigintIsqrt` to exclude boundary ties without float rounding.
  - Solve 2×2 / linear systems via exact `BigInt` Cramer + `extGcdBigInt` collinear fallback or incremental `Rational` Gauss-Jordan RREF; handle shared-velocity (`dv === 0n`) axes explicitly.
  - Clip viewport rays in world coordinates via exact `Rational` Liang-Barsky before normalizing the two clipped endpoints—prevents `BigInt` velocity underflow (`(v * scale) / span === 0n`).
- **Bitwise & sorting traps**:
  - Never use 32-bit JS bitwise ops for widths `>= 31` (52-letter alphabets, wide grids, >31 items): use `BigInt` masks + `bitCount` / `bigintLog2`, or validate masks strictly in `[0, 0x7fffffff]`.
  - Never call `Array.prototype.sort()` without a numeric comparator (or sort private `Float64Array`/`Int32Array` copies).
  - Never call `Math.log2(Number(big))` (overflows past `2^1024`): use `bigintLog2` with `-1` (never `0 = log2(1n)`) as the unvisited sentinel. Scale huge `BigInt` coordinates in `BigInt` (`(val - lo) * scale / span`) before `Number()` conversion.

---

## 4. Strict V8 100% Coverage & Encapsulation Hygiene

- **Zero default parameters in covered `.ts` files**: V8 treats every `param = default` as an extra branch. Pass explicit arguments or normalize via `validateMaxSteps(opt, DEFAULT)` and test both omitted and explicit calls.
- **Zero unreachable defensive branches**:
  - Make invalid states unrepresentable via constructor invariants, exact parameter arity, and discriminated unions.
  - Replace `switch` + unreachable `default` with total `Record<Union, ...>` tables; never duplicate the same validation in both parser and constructor.
  - Use mathematically tight loop bounds (e.g., `i > 0` when index `0` is guaranteed valid) and branch-free guards like `Math.max(1, maxVal)` instead of `if (maxVal === 0)`.
- **Never call `Object.freeze()` on `TypedArray`s**: V8 throws `TypeError` on non-empty TypedArrays. Encapsulate `Int32Array`/`Uint8Array`/`Uint32Array`/`Float64Array` in private fields, freeze only the owning wrapper/plain arrays, and translate internal `-1` sentinels to `null` at public boundaries.
- **Prototype-safe collections**: Use `Map`/`Set` (not plain objects) for arbitrary string keys (labels, nodes, wires) to avoid `Object.prototype` collisions and preserve insertion order.
- **Coverage edge tests**: Include borderless grids (to hit all 4 OOB neighbor checks), empty/single-element inputs, exact-threshold equality (`>=` vs `>`), and trace-cap boundaries (`maxSteps <= reservedFrames` so `sampleTraceIndices` never receives `<= 0`).

---

## 5. High-ROI Algorithmic Patterns & Performance

- **Flat TypedArrays + generation stamping**:
  - 1-cell zero-padded 2D/3D `Uint8Array`/`Int32Array` grids eliminate inner bounds checks and guarantee a connected outer shell at `(0,0,0)` for exterior flood BFS.
  - Reuse method-local generation-stamped `Uint32Array`/`Int32Array` arrays across trials to eliminate GC and zero-fill overhead while remaining re-entrant. Use `TextDecoder('ascii')` on flat ASCII byte grids for fast board fingerprints.
- **Graph, Search & DP reductions**:
  - **Reverse BFS from target** unifies single-start and multi-source shortest paths in one pass.
  - **Corridor contraction** (collapsing degree-2 chains, pruning `from === end` / `to === start`) + descending-weight CSR branch-and-bound with admissible upper bounds solves hard longest-simple-path mazes in milliseconds.
  - **Macro-leg graphs** `(r, c, axis)` + intrusive circular Dial buckets outperform 4D heap Dijkstra on constrained-turn grids.
  - **All-optimal-paths extraction**: Stop forward Dijkstra at `poppedCost > bestScore` (not first goal pop), then run `O(V_opt)` tight-edge backward BFS (`dist[u] + w === dist[v]`).
  - **Offline connectivity**: Record earliest-block timestamps in an `Int32Array` and run reverse-time `DisjointSet` percolation (`firstFall[idx] === k`) for near-linear cut finding.
  - **Bitmask & separable sweeps**: Block-strided SOS Max-DP cuts disjoint 2-agent subset pairing from `O(3^K)` to `O(K · 2^K)`. Separable 1D edge-cut sweeps (`prefix * (G - prefix) * width`) replace `O(G^2)` pairwise Manhattan sums.
- **Cycle fast-forwarding & periodicity**:
  - Key rho-cycle states strictly by a sound bisimulation invariant (full board fingerprint or top-down reachable cavity)—never scalar metrics like load/score, which collide early.
  - Use `solveCongruences` (multi-hit `BigInt` CRT) with max-prefix anchor checks for simultaneous periodic hits; verify `second - first === first` before folding zero-phase `lcmBigInt`; validate polynomial extrapolations against an extra `k = 3` sample to catch delayed stabilization.
- **Geometry & parsing idioms**:
  - Use Shoelace + Pick's theorem or north-port scanline parity instead of rasterizing huge loops; point+gap coordinate compression + 2D prefix sums for large orthogonal polygons; 4-quadrant convex/concave corner counting for polygon sides (immune to diagonal pinches).
  - Never key tree nodes by basename (inputs reuse identical names across subtrees); always key by canonical path or node ID. On signed difference pyramids, test `row.every(v => v === 0n)` (never `sum === 0n`).

---

## 6. Differential Oracles & Verification Discipline

- **Always cross-check fast/subtle solvers against an independent oracle in tests** before submitting:
  - *Math / Linear / CRT*: closed-form `O(1)` / `BigInt` Cramer vs brute-force grid scan, `Rational` RREF, or per-divisor CRT residue vector; algebraic inversion vs raw-input substitution.
  - *Intervals & Geometry*: two-pointer interval split vs per-item brute-force + backward endpoint pullback; scanline parity vs Shoelace+Pick's + 2×-expanded BFS; coordinate-free 3D cube net folding vs 3D `[0..S-1]^3` voxel-sticker walker.
  - *Graphs & DP*: SOS Max-DP vs `O(3^K)` submask / raw minute-by-minute DP; tight-edge backward BFS vs per-directed-state bidirectional Dijkstra; contracted CSR DFS vs uncontracted raw-grid DFS; min-cut / Stoer-Wagner vs Edmonds-Karp max-flow / randomized contraction; flat-grid diffusion / blizzard BFS vs `Set<string>` simulator; cycle fast-forwarding vs un-accelerated multi-period linearity (`f(μ + kλ + r) === f(μ + r) + kΔ`).
- **Adversarial & fuzz fixtures**: Pair official examples with 20–100 seeded PRNG cases plus explicit boundary fixtures: `> 2^53` and odd-low-bit `> 2^63` BigInts, negative coordinates, duplicates, unreachable/cyclic inputs, and all symmetry/pinch quadrants.

---

## 7. Visualization, Layout & Runtime Contracts

- **`.tsx`-only under `viz/`**: Vitest's coverage glob (`[0-9]{4}/**/shared/**/*.ts`) covers every `.ts` file under `shared/`. Put pure-TS layout/projection helpers directly in `dayNN/shared/` (with 100% tests) and keep all UI/Canvas/SVG files under `shared/viz/` and `partP/viz/` strictly `.tsx`.
- **Zero `viz/` imports in `shared/index.ts`**: Keep `dayNN/shared/index.ts` and `partP/domain/` 100% DOM/React-free so Node CLI and Web Workers import them cleanly.
- **Layout & light-mode contrast**: Wrap multi-card visualizers in `<div className="stack">`; wrap both `parse` and `trace` in `try/catch` so invalid or undersized custom inputs render friendly errors. Style exclusively for the site's light theme using CSS variables (`--surface`, `--bg`, `--border`, `--text`, `--muted`, `--accent`, `--gold`, `--ok`, `--warn`, `--err`) with WCAG-legible contrast.
- **Bounded traces & rendering performance**: Always bound trace frames via `validateMaxSteps` + `sampleTraceIndices` (use a 2-pass probe-then-capture when history is huge, preserving key milestones/landmarks). Batch large grids into elevation-band SVG `<path>`s or render on HiDPI `<canvas>`—never mount thousands of individual SVG elements.
- **Runtime escalation & workflow**:
  - Escalation ladder: main thread → Web Worker (`> ~500 ms` or embarrassingly parallel) → local Rust CLI (only if optimized TS/Workers would exceed 5 min or browser RAM).
  - Parallel years run in isolated worktrees with serialized AoC submissions (`.aoc-cache/rate-limit.json`).
  - Final-day Part 2 uses `createFinaleSolver` (`level=2`, `answer=0`) after all 49 prior stars are verified.
