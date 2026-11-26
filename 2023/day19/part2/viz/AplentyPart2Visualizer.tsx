import type { VisualizerProps } from '../../../../shared/viz';
import { WorkflowTraceVisualizer } from '../../shared/viz/WorkflowTraceVisualizer';
import { solver } from '../domain';

/** Interactive hyperrectangle-split visualizer for AoC 2023 Day 19 Part 2. */
export function AplentyPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <WorkflowTraceVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (Hyperrectangle Split)"
    />
  );
}
