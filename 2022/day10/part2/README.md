# 2022 Day 10 Part 2 — Cathode-Ray Tube

## Consumer Overview

Simulates the clock-driven CPU (`noop` / `addx`), rasterizes cycles `1..240` onto a `40x6` phosphor CRT grid where a 3-pixel sprite `[X - 1, X, X + 1]` illuminates matching horizontal beam positions, and decodes the 8 resulting `5x6` uppercase glyphs.

- **Public entrypoints** (`./domain/index.ts`):
  - `solver`: `PuzzleSolver<CpuProgram, string, CrtBeamTraceFrame>`
  - `solvePart2(program)` / `tracePart2(program, options?)`
  - `CrtScreen`, `rasterizeCrtScreen`, `rasterizeCrtPrefix`, `tryDecodeCrtScreen`, `decodeCrtScreen`
  - `CANONICAL_GLYPHS`, `packGlyphMask`, `formatGlyphMask`, `buildGlyphLookup`, `decodeGlyphMask`
  - `CrtBeamTraceFrame`, `buildCrtBeamTrace`, `slotCompletionCycle`
- **Manifest** (`./index.ts`): exports `manifest: PuzzlePartManifest` with `exampleAnswer: 'ELFCLOCK'`.

## Maintainer Architecture

- **Dependency DAG**: `shared` (`2022/day10/shared`) → `domain/font.ts` → `domain/screen.ts` → `domain/trace.ts` → `domain/solver.ts` → `domain/index.ts` → `viz/*` & `index.ts`. Zero imports from `part1/`.
- **Bitpacked OCR (`font.ts`)**: Each `5x6` glyph is packed into a 30-bit integer mask (`bit = row * 5 + col`, max `(1 << 30) - 1`). `buildGlyphLookup` validates `/^[A-Z]$/` labels and rejects duplicate mask collisions at module load.
- **Immutable Framebuffer (`screen.ts`)**: `CrtScreen` defensively copies a 240-byte `Uint8Array` (freezing only the outer instance, never the TypedArray) and derives `litCount`, `glyphMaskAt`, and `toLines` dynamically with zero stored derived state.
- **Bounded Trace (`trace.ts`)**: `buildCrtBeamTrace` samples at most `DEFAULT_MAX_TRACE_STEPS` (`240`) cycles and progressively reveals each slot once the beam reaches `slotCompletionCycle(slot) = 205 + 5 * slot`.
- **Visualization (`viz/`)**: `CrtPhosphorDisplay` renders the `40x6` SVG raster, aligned `40`-column sprite bracket, and 8-slot OCR ribbon using theme CSS variables (`--text`, `--surface`, `--border`, `--accent`, `--ok`, `--gold`).
