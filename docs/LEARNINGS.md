# Advent of Code — Learnings & Playbook

Reusable algorithmic patterns, parsing idioms, performance tricks, and AoC pitfalls accumulated across solved puzzles. Consult this file during puzzle analysis and design review before implementing each new part.

## Promoted Shared Utilities (`shared/core/`)
- `solver.ts` — `PuzzleSolver`, `executeSolver`, `Clock` contract for deterministic timing & tracing.
- `math.ts` — `euclideanMod(dividend, divisor)` with safe-integer validation and `-0` normalization (added in 2025 Day 1 Part 1).

## Algorithmic Patterns & Scaling Traps
- **Preserve raw magnitudes when parsing Part 1** (2025 Day 1): Example inputs often use small numbers (`< 100`) while personal inputs include multi-revolution/large values (`up to 998`); preserve unreduced values in `<year>/dayNN/shared/` so Part 2 can reuse the exact parser without churn.
- **Avoid single-wrap conditionals on modular arithmetic**: Always use `euclideanMod` with pre-reduced step size (`distance % M`) so arbitrarily large safe integers never overflow or produce negative remainders.
- **Differential testing against simple brute-force oracles** (2025 Day 1 Part 2): Whenever a closed-form `O(1)` formula replaces step-by-step simulation (such as circular crossing counts with `p = 0` left/right asymmetry), add a test-only brute-force oracle across all boundary states to guarantee zero off-by-one bugs before submitting to AoC.

## Parsing & Numeric Pitfalls
- Always check whether puzzle answers can exceed `Number.MAX_SAFE_INTEGER` (`2^53 - 1`); use `BigInt` whenever totals/products can grow super-linearly.
- **Exact `BigInt` ceiling/floor division** (2025 Day 2): For positive `L, M`, `(L + M - 1n) / M` is exact `ceil(L / M)` and `U / M` is exact `floor(U / M)`; when mapping `BigInt` ranges to SVG coordinates, scale `(val - lo) * 1000n / span` in `BigInt` before converting to `Number`.
- Trim trailing newlines cleanly without stripping meaningful leading/trailing spaces on grid or ASCII-art inputs.

## Visualization & Runtime Notes
- Keep `domain/` 100% pure (zero DOM/React imports) and emit compact, bounded trace snapshots so large personal inputs never freeze the UI.
- Escalation ladder: main thread → Web Worker (> ~500 ms or embarrassingly parallel) → local Rust CLI (only if optimized TS/Workers would exceed 5 minutes or browser memory limits).

## Future Scaling Notes
- **Multi-year parallelism (post-2025)**: After completing 2025, prior years can be tackled **2–3 years in parallel** (e.g., isolated worktrees/branches per year merged into `main`, with `site/data/status.json` updates merged cleanly and AoC submissions serialized around `.aoc-cache/rate-limit.json`). When reaching 2022, archive the existing `2022/` Rust solutions to `archive/2022-rust/` first.
