# 2022 Day 18 Shared Domain

## Consumer Guide
- **`parseVoxelCoords(raw)` / `parseDroplet(raw)`**: Parses newline-delimited `x,y,z` coordinates into an immutable `VoxelDroplet`.
- **`VoxelDroplet`**: Deduplicates lava cubes inside a 1-voxel-padded bounding grid and computes `totalSurfaceArea`, `countFacesAgainst`, `summarizeSlices`, and `sliceOccupancy`.
- **`ExteriorFlood`**: Performs a 6-connected exterior air BFS from padding corner `(0, 0, 0)` and marks unreachable air pockets as `CELL_TRAPPED_AIR` to expose `exteriorSurfaceArea`, `trappedSurfaceArea`, and `trappedAirCount`.
- **`traceTotalSurface` / `traceExteriorSurface`**: Emits uniformly sampled `DropletTraceFrame` Z-slice snapshots bounded by `DEFAULT_TRACE_MAX_STEPS` (`60`).
- **Visualizers**: Reusable React components live under `./viz/` (`DropletIsometricCanvas.tsx`, `DropletSliceCanvas.tsx`, `DropletVisualizer.tsx`) and are imported directly by Part 1 and Part 2 visualizers (never re-exported from `./index.ts`).

## Maintainer Notes
- **Grid layout**: Flat `Uint8Array` indexed as `lx + ly * sizeX + lz * sizeX * sizeY` with `originD = minD - 1` and `sizeD = maxD - minD + 3` so every lava cube sits strictly inside `[1..sizeD - 2]`.
- **Overflow & memory guard**: `computeGridDimensions` computes bounding volume in `BigInt` before converting to `Number`, rejecting volumes above `MAX_GRID_VOLUME` (`2_000_000`).
- **Immutability**: Domain classes call `Object.freeze(this)` without freezing internal `Uint8Array`/`Int32Array` buffers; all accessors return defensive copies.
