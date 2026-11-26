# 2025 Day 12 Shared Domain (`polyomino` & `farm`)

## User / Consumer Documentation
Provides immutable, frozen value objects and strict parsing for Advent of Code 2025 Day 12 ("Christmas Tree Farm"):
- `PolyominoOrientation`: Tight-normalized (`minRow = 0, minCol = 0`), column-major sorted orientation with derived `area`, `width`, `height`, and `anchorRow`.
- `PolyominoShape`: Validated polyomino shape with derived bounding-box metrics (`shortSide`, `longSide`), unique $D_4$ `orientations`, `fitsIn(w, h)`, and `orientationFitting(w, h)`.
- `TreeRegion` / `TreeFarm` / `parseTreeFarm(raw)`: Parses `<id>:` shape grids (`#`/`.`) and `<W>x<H>: <counts...>` region lines, rejecting malformed or inconsistent inputs.

## Developer / Maintainer Documentation
- Zero external/UI dependencies; strictly pure TypeScript.
- Column-major sorting ensures `orientation.cells[0]` is always `(anchorRow, 0)`, enabling fast column-scanline frontier bitboard placement in `part1/domain/packer.ts`.
- All derived properties are computed dynamically from canonical fields (no stored derived state).
