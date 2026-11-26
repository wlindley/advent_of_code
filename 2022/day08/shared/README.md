# 2022 Day 8 Shared Domain (`2022/day08/shared`)

Pure TypeScript forest height-map parser, `O(R * C)` 4-pass monotonic-stack sightline analyzer, and reusable SVG canopy visualizer for Advent of Code 2022 Day 8 ("Treetop Tree House").

## Consumer Interface

- `forest.ts`: `CARDINAL_DIR` (`UP=0, RIGHT=1, DOWN=2, LEFT=3` aligned with `DIRS_4`), `CARDINAL_DIRS`, `CardinalDir`, `TreeHeight`, and immutable `ForestGrid` (`parse`, `rows`, `cols`, `size`, `inBounds`, `heightAt`).
- `sightlines.ts`: `SightlineRay` and immutable `ForestSightlines` (`analyze`, `visibleCount`, `visibilityMaskAt`, `isVisibleFrom`, `isVisible`, `distanceAt`, `scenicScore`, `rayFor`).
- `viz/CanopySightlineSvg.tsx`: reusable batched-path canopy heatmap and 4-way sightline inspector SVG component (imported directly by part visualizers; never re-exported from `shared/index.ts`).

## Maintainer Architecture

- **DAG**: `forest.ts` -> `sightlines.ts` -> `index.ts` (strictly pure TypeScript; zero React/DOM imports).
- **Monotonic Stack Invariant**: Each directional pass maintains strictly decreasing heights on a fixed 10-slot workspace (`stackHeight`, `stackPos`), replacing equal-height blockers in place so both unobstructed edge visibility (`visibilityMask`) and viewing distance (`dirDistances`) resolve in `O(R * C)` total time and space.
- **No Stored Derived State**: `visibleCount` and `scenicScore` are computed dynamically from the precomputed mask and directional distances.
