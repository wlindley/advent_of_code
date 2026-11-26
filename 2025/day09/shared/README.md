# Day 09 Shared Tile Geometry

Shared pure TypeScript value objects and coordinate parser for Advent of Code 2025 Day 9.

## Consumer Guide

- `TilePoint(x: bigint, y: bigint)`: Frozen 2D integer tile coordinate with `.equals(other)`.
- `TileRect(cornerA, cornerB)`: Frozen axis-aligned inclusive tile rectangle exposing `.minX`, `.maxX`, `.minY`, `.maxY`, `.width`, `.height`, `.area`, and `TileRect.bounding(points)`.
- `parseTilePoints(raw)`: Parses `x,y` lines into a frozen array of `TilePoint` values using exact `BigInt` arithmetic while preserving raw input vertex order.

## Maintainer Notes

- `TileRect` stores only its two defining corner points (`cornerA`, `cornerB`) and computes bounds/width/height/area via getters to maintain a single source of truth.
- `parseTilePoints` uses strict `/^-?\d+$/` token matching after outer trim and `/\r?\n/` splitting so internal spaces or malformed coordinates fail fast.
- Zero external dependencies; designed for both Part 1 and Part 2.
