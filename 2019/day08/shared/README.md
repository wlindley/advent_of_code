# `2019/day08/shared` — Space Image Format Shared Kernel & Visualizer

## Consumer Guide
Pure TypeScript domain models, evaluation policies, 5x6 bitmap decoder, trace builder, and shared React SVG visualizers for Advent of Code 2019 Day 8.

- `index.ts`: pure TS barrel exporting `SpaceImage`, `ImageDimensions`, `CompositeImage`, `MIN_ZERO_CHECKSUM_POLICY`, `DECODED_MESSAGE_POLICY`, `SpaceImageSolver`, `buildSpaceImageTrace`, `decodeCompositeMessage`, and `vizLayout` helpers (zero `viz/` imports).
- `viz/`: React visualizers (`SpaceImageVisualizer`, `SpaceImageGridSvg`, `LayerHistogramSvg`) bound via `solver` props.

## Maintainer Guide
- **Immutability & Buffers**: Value objects (`ImageDimensions`, `LayerDigitCounts`, `SpaceImage`, `CompositeImage`, `SpaceImageTraceFrame`) are frozen with defensive `Uint8Array` / `Int32Array` copies (typed arrays themselves are never frozen).
- **Zero Stored Derived State**: Checksums, layer counts, resolved counts, and decoded glyph slots are computed via getters.
- **Bounded Trace**: `buildSpaceImageTrace` samples up to `DEFAULT_MAX_TRACE_FRAMES = 100` frames via `sampleTraceIndices` while preserving `3..9` digits in trace snapshots so small Part 1 examples visualize cleanly.
