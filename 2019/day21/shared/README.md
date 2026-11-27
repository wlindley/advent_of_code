# Day 21 Shared Springdroid Kernel

Pure TypeScript Springscript evaluator, hull crossing simulator, O(1) cursor-indexed ASCII/damage Intcode I/O channel, solver, and SVG layout helpers shared across Advent of Code 2019 Day 21 Parts 1 and 2.

## Consumer Guide

- `SpringscriptProgram`: Validated immutable Springscript program (`<= 15` instructions; `WALK` restricts sensors to `A..D`, `RUN` unlocks `E..I`) with `toAscii()` and `evaluate(sensors)`.
- `simulateHullCrossing(hull, program)`: Simulates tick-by-tick walking (`+1`) and jumping (`+4`) across a `#`/`.` hull string.
- `runSpringdroidProgram(program, script)` & `extractHullDamage(result)`: Executes an Intcode VM with `SpringdroidAsciiIo` and returns ASCII logs plus optional `bigint` hull damage.
- `SpringdroidSolver`: `PuzzleSolver` parameterized by `WALK_POLICY` (Part 1) or `RUN_POLICY` (Part 2), producing bounded `SpringdroidTraceFrame` sequences.
- `buildSpringdroidSvgLayout(frame)`: Pure SVG geometry layout for hull tiles, sensor pins, droid marker, and jump/walk paths.

## Maintainer Architecture

Module DAG (strictly acyclic, zero `viz/` imports in `index.ts`):
- `springscript.ts` -> standalone pure TS
- `hullSimulator.ts` -> `springscript.ts`
- `asciiIo.ts` -> `../../shared/intcode` (`IoChannel`)
- `springdroidRunner.ts` -> `../../../shared/core`, `../../shared/intcode`, `asciiIo.ts`, `springscript.ts`
- `exampleProgram.ts` -> standalone constants
- `springdroidSolver.ts` -> `../../../shared/core`, `../../shared/intcode`, `exampleProgram.ts`, `hullSimulator.ts`, `springdroidRunner.ts`, `springscript.ts`
- `vizLayout.ts` -> `springscript.ts`, `hullSimulator.ts`, `springdroidSolver.ts`
- `viz/HullDiagramSvg.tsx` & `viz/SpringdroidVisualizer.tsx` -> React light-mode SVG UI consuming `shared/index.ts` and `shared/viz` `PlaybackControls`
