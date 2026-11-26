# 2023 Day 03 Shared Domain (`EngineSchematic`, `PartNumber`, `SchematicSymbol`)

## Consumer Guide

- **`PartNumber`**: Immutable, frozen horizontal digit span (`id`, `row`, `startCol`, `endCol`, `value`) with dynamic `.length`.
- **`SchematicSymbol`** / **`isAsciiDigit`** / **`isSchematicSymbol`**: Immutable, frozen symbol entity (`id`, `row`, `col`, `char`) with dynamic `.isGearCandidate` (`char === '*'`).
- **`EngineSchematic`**: Parses rectangular schematic text via `EngineSchematic.parse(raw)` into `grid`, `numbers`, `symbols`, and provides `adjacentNumbersOf(symbol)` returning deduplicated frozen `PartNumber[]`.

## Maintainer Guide

- Numbers are parsed strictly as unsigned `[0-9]+` spans (so `-` is always a symbol, never a negative sign) and validated against `Number.isSafeInteger`.
- An internal `Int32Array` (`cellToNumberId`) maps each grid cell to its owning `PartNumber.id` (or `-1`) so `adjacentNumbersOf` probes `DIRS_8` in `O(1)` time and deduplicates by `partId`.
- All entities are frozen at construction and all helpers are top-level functions `< 30 LoC`.
