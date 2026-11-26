import type { VisualizerProps } from '../../../../shared/viz';
import { ChronospatialDebugger } from '../../shared/viz/ChronospatialDebugger';
import { solver } from '../domain';

/** Interactive Chronospatial VM step debugger for Day 17 Part 1. */
export function ChronospatialPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <ChronospatialDebugger
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (VM Execution)"
    />
  );
}
