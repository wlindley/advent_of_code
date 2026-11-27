# 2021 Day 20 Shared Domain

## User / Consumer Overview
Pure TypeScript domain modules for Advent of Code 2021 Day 20 (*Trench Map*), modeling infinite 2D binary images with explicit uniform-void parity and policy-parameterized multi-pass enhancement.

- `parseTrenchMap(raw)`: parses the 512-char algorithm table and initial finite image grid.
- `enhanceImage(image, algorithm, steps)` / `traceEnhancement(input, totalSteps, options)`: runs double-buffered 3x3 convolution with exact void tracking.
- `TrenchMapSolver(policy)`: implements `PuzzleSolver` for Part 1 (`PART1_POLICY`, 2 passes) and Part 2 (`PART2_POLICY`, 50 passes).

## Developer / Maintainer Notes
- **Module DAG**: `types` -> `parser` / `enhancer` -> `solver` <- `policy`. `shared/index.ts` exports pure-TS symbols only; `shared/viz/` holds React canvas visualizers.
- **Infinite Void Invariant**: Each pass grows the active bounding box by 1 pixel per side and stamps a 2-pixel halo of the current `background` around the active box in the source buffer before evaluating 3x3 neighborhoods via a rolling 3-bit horizontal window.
- **Memory Safety**: `Uint8Array` buffers remain unfrozen internally and expose defensive copies at boundaries.
