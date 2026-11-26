# 2022 Day 10 Shared CRT CPU & Trace Helpers

## Consumer Usage
Import `CpuProgram`, `CpuTimeline`, `CycleSnapshot`, `ProbeReading`, `CrtTraceFrame`, `sampleTimelineProbes`, and `buildCrtTrace` from `2022/day10/shared`.
Import `CrtTimelineVisualizer` directly from `2022/day10/shared/viz/CrtTimelineVisualizer` in React visualizers.

## Maintainer Architecture
- `program.ts`: Immutable `CpuProgram` parser (`noop`, `addx V`) preserving inner line errors and validating safe integers.
- `timeline.ts`: Typed-array `CpuTimeline` (`Float64Array`, `Uint32Array`, `Uint8Array`) with frozen shell and dynamic `CycleSnapshot` getters.
- `trace.ts`: Probe sampling (`ProbeReading`) and bounded `CrtTraceFrame` emission (`DEFAULT_MAX_TRACE_STEPS = 240`).
- `viz/OscilloscopeChart.tsx` & `viz/CrtTimelineVisualizer.tsx`: SVG register waveform, 40-col raster strip, pipeline/probe ledger, and optional 40x6 CRT matrix.
