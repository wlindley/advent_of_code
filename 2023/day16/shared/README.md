# AoC 2023 Day 16 — Shared Contraption & Beam Optics

## Consumer Guide

- `optics.ts`: Direction constants (`DIR_N`, `DIR_E`, `DIR_S`, `DIR_W`), tile codes, `OUTGOING_MASKS` transition table, `outgoingMask()`, `encodeTileChar()`, `decodeTileCode()`, and `createBeamState()`.
- `contraption.ts`: Immutable `Contraption` grid (`fromLines`, `parseContraption`, `inBounds`, `tileCodeAt`, `tileAt`, `copyTiles`, `edgeEntries`, `toLines`).
- `beamFrame.ts`: Immutable `BeamWaveFrame` snapshot (`wave`, `totalWaves`, `entry`, `frontier`, dynamic `energizedCount`, `maskAt`, `isEnergized`).
- `beamTracer.ts`: Reusable `BeamTracer` (`countEnergized`, `traceWaves`, `DEFAULT_MAX_TRACE_STEPS = 120`).
- `viz/ContraptionCanvas.tsx` & `viz/contraptionDrawing.tsx`: HiDPI Canvas visualization primitives (imported directly by `part1/viz` and `part2/viz`, never from `shared/index.ts`).

## Maintainer Architecture

- `BeamTracer` pre-allocates `#visited: Uint8Array(size)` and a flat `#queue: Int32Array(4 * size)` storing `(cellIdx << 2) | dir` states.
- `#resetQueue(entry)` energizes the entry cell immediately so Wave 0 applies the entry tile's optics before stepping into neighbors.
- `traceWaves` performs a fast wave-count pass followed by a sampled snapshot pass using `sampleTraceIndices` from `shared/core`.
