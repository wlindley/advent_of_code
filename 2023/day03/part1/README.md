# 2023 Day 03 Part 1 — Gear Ratios

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `solver` (`parse`, `solve`, `trace`), `DEFAULT_MAX_TRACE_STEPS` (`200`), `SchematicTraceFrame`, `sumPartNumbers`, and `traceSchematic`.
- **Site manifest** ([index.ts](index.ts)): registers metadata, the 10×10 example (`exampleAnswer: '4361'`), `solver`, and `GearRatiosVisualizer`.

## Maintainer Guide

- `sumPartNumbers` iterates `schematic.symbols`, queries `schematic.adjacentNumbersOf(symbol)` (`O(1)` via `Int32Array` cell lookup across `DIRS_8`), and deduplicates across symbols with a `Uint8Array` visited bitset.
- `traceSchematic` walks every symbol to compute exact `runningSum` and `matchedPartIds` while uniformly sampling up to `maxSteps` frames via `sampleTraceIndices`.
- `GearRatiosVisualizer` renders a full interactive SVG grid for small schematics (`<= 20×30`) and switches to a `<canvas>` overview plus a 15×15 local SVG lens (`schematicCanvas.ts`) for large inputs, with `PlaybackControls` and empty-symbol / error fallbacks.
