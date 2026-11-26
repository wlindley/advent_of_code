import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { EngineSchematic } from '../../shared';
import {
  SchematicTraceFrame,
  sumPartNumbers,
  traceSchematic,
} from './trace';

/** Pure TypeScript solver for Advent of Code 2023 Day 3 Part 1. */
export const solver: PuzzleSolver<EngineSchematic, number, SchematicTraceFrame> = Object.freeze({
  parse(raw: string): EngineSchematic {
    return EngineSchematic.parse(raw);
  },

  solve(schematic: EngineSchematic): number {
    return sumPartNumbers(schematic);
  },

  trace(schematic: EngineSchematic, options?: TraceOptions): readonly SchematicTraceFrame[] {
    return traceSchematic(schematic, options);
  },
});
