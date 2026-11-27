# 2021 Day 13 — Shared Transparent Origami Domain

Pure TypeScript domain engine and reusable canvas visualizer for Advent of Code 2021 Day 13 (*Transparent Origami*).

## Consumer API (`shared/index.ts`)

- **Models (`models.ts`)**: `Dot`, `FoldAxis`, `DotBounds`, `FoldInstruction`, `DotSheet` (sorted, deduplicated, $O(\log N)$ `hasDot`), and `OrigamiManual`.
- **Parser (`parser.ts`)**: `parseOrigamiManual(raw)` validates coordinates and `fold along (x|y)=N` lines across CRLF/LF inputs.
- **Folding (`folder.ts`)**: `applyFold(sheet, fold)` produces an immutable `FoldOutcome` tracking `stationaryDots`, `reflectedDots`, `mergedDots`, and dynamic `overlapCount`; `applyFolds(sheet, folds, count)` applies `count` sequential folds.
- **OCR (`bitmapFont.ts`)**: `CANONICAL_GLYPHS` (20 canonical 30-bit $5 \times 6$ templates), `packGlyphMask`, `tryDecodeDotSheet`, `decodeDotSheet`, and `formatDotSheet`.
- **Policies & Solver (`policy.ts`, `trace.ts`, `solver.ts`)**: `OrigamiSolver` parameterized by `FIRST_FOLD_COUNT_POLICY` (Part 1) or `ALL_FOLDS_CODE_POLICY` (Part 2), with bounded streaming `captureOrigamiTrace`.

## Maintainer Architecture

- **Dependency DAG**: `models` → `parser` / `folder` / `bitmapFont` → `policy` / `trace` → `solver` → `index.ts` (zero `viz/` imports).
- **No Stored Derived State**: `DotBounds.width`/`height`, `DotSheet.dotCount`/`bounds`, `OrigamiManual.foldCount`, and `FoldOutcome.overlapCount` are computed via getters.
- **Polymorphic Axes**: `AXIS_ADAPTERS` maps `'x'` and `'y'` without `switch` chains; `applyFold` validates against crease collisions and negative reflections.
- **Shared Visualization (`shared/viz/`)**: `OrigamiVisualizer` and `OrigamiSheetCanvas` switch automatically between scatter-dot mode and $5$-column pixel-tile mode while computing previews dynamically.
