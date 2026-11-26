import type { VisualizerProps } from '../../../../shared/viz';
import { WorkflowTraceVisualizer } from '../../shared/viz/WorkflowTraceVisualizer';
import { solver } from '../domain';

/** Interactive part-routing visualizer for AoC 2023 Day 19 Part 1. */
export function AplentyPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <WorkflowTraceVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (Part Routing)"
    />
  );
}
