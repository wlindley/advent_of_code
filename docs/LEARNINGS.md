# Advent of Code — Learnings & Playbook

Reusable algorithmic patterns, parsing idioms, performance tricks, and AoC pitfalls accumulated across solved puzzles. Consult this file during puzzle analysis and design review before implementing each new part.

## Promoted Shared Utilities (`shared/core/`)
- `solver.ts` — `PuzzleSolver`, `executeSolver`, `Clock` contract for deterministic timing & tracing.
- *(Utilities like grids, BFS/Dijkstra, number theory, and Web Worker pools will be added here as puzzles motivate them.)*

## Algorithmic Patterns & Scaling Traps
- *(Populated automatically as 2025 and prior years are solved.)*

## Parsing & Numeric Pitfalls
- Always check whether puzzle answers can exceed `Number.MAX_SAFE_INTEGER` (`2^53 - 1`); use `BigInt` whenever totals/products can grow super-linearly.
- Trim trailing newlines cleanly without stripping meaningful leading/trailing spaces on grid or ASCII-art inputs.

## Visualization & Runtime Notes
- Keep `domain/` 100% pure (zero DOM/React imports) and emit compact, bounded trace snapshots so large personal inputs never freeze the UI.
- Escalation ladder: main thread → Web Worker (> ~500 ms or embarrassingly parallel) → local Rust CLI (only if optimized TS/Workers would exceed 5 minutes or browser memory limits).
