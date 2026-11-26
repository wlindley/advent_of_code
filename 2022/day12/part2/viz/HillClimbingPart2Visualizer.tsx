import type { VisualizerProps } from '../../../../shared/viz';
import { HillClimbingVisualizer } from '../../shared/viz/HillClimbingVisualizer';
import { ANY_LOWEST_START_CONDITION, solver } from '../domain';

/** Part 2 wrapper rendering reverse-BFS wavefront from `E` to the nearest lowest (`a`/`S`) cell. */
export function HillClimbingPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <HillClimbingVisualizer
      rawInput={rawInput}
      solver={solver}
      condition={ANY_LOWEST_START_CONDITION}
    />
  );
}
