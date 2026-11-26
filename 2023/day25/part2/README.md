# AoC 2023 Day 25 Part 2 — Snowverload (Finale)

## User / Consumer Guide
Verifies that all 49 preceding Advent of Code 2023 stars have been collected and returns the AoC finale completion trigger (`0`), paired with an interactive 50-star illumination visualizer.

## Developer / Maintainer Guide
- Thin 6-line domain entrypoint delegating to `createFinaleSolver(50)` in `shared/core/finale.ts` with 100% V8 coverage and zero coupling to `part1/`.
