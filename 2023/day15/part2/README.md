# AoC 2023 Day 15 Part 2 — Lens Library

## Consumer Guide

- **Domain entrypoint**: `2023/day15/part2/domain` exports `solver` (`PuzzleSolver<readonly LensInstruction[], number, HashmapTraceFrame>`), `solveFocusingPower`, `traceHashmapSequence`, `parseLensInstruction`, `parseLensInstructions`, `OpticalBench`, `LensBoxSnapshot`, `LensEntry`, `HashmapTraceFrame`, and `DEFAULT_MAX_TRACE_STEPS = 120`.
- **Web manifest**: `2023/day15/part2/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `LensLibraryPart2Visualizer` displays step & outcome telemetry badges, the shared `HashPipelineRibbon` for the instruction label's target box, `OpticalBenchRack` (ordered lens slots per occupied box with focusing-power tooltips), and `PlaybackControls`.

## Maintainer Architecture

- **Module DAG**: `2023/day15/shared` -> `domain/bench.ts` -> `domain/instruction.ts` -> `domain/trace.ts` -> `domain/solver.ts` -> `domain/index.ts`.
- `domain/bench.ts`: Encapsulates 256 insertion-ordered `Map<string, number>` boxes inside `OpticalBench` so `upsert` replaces focal lengths in-place or appends new lenses, while `remove` shifts trailing slots automatically and reports `LensMutationOutcome`.
- `domain/instruction.ts`: Models `RemoveLensInstruction` and `UpsertLensInstruction` polymorphically behind `LensInstruction` with dynamic `boxIndex` and `rawToken` getters.
- `domain/trace.ts`: Uses `sampleTraceIndices(instructions.length, maxSteps)` to emit at most `DEFAULT_MAX_TRACE_STEPS` immutable `HashmapTraceFrame` snapshots with dynamically computed counts and focusing power.
- `domain/*.test.ts`: Verifies validation boundaries, bench slot semantics, polymorphic instruction execution, trace sampling caps, `executeSolver` with a deterministic `Clock`, and a brute-force array + BigInt polynomial hash differential oracle across 120 seeded sequences.
