import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { EngineSchematic } from '../../shared';
import { gearRatioOf, sumGearRatios } from './gearRatio';
import { GearTraceFrame, traceGears } from './trace';

export { gearRatioOf, sumGearRatios };

/** Pure TypeScript solver for Advent of Code 2023 Day 3 Part 2. */
export const solver: PuzzleSolver<EngineSchematic, bigint, GearTraceFrame> = Object.freeze({
  parse(raw: string): EngineSchematic {
    return EngineSchematic.parse(raw);
  },

  solve(schematic: EngineSchematic): bigint {
    return sumGearRatios(schematic);
  },

  trace(schematic: EngineSchematic, options?: TraceOptions): readonly GearTraceFrame[] {
    return traceGears(schematic, options);
  },
});
