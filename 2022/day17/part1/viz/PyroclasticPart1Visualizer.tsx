import type { VisualizerProps } from '../../../../shared/viz';
import { PyroclasticVisualizer } from '../../shared/viz/PyroclasticVisualizer';
import { PART1_ROCK_COUNT, solver } from '../domain';

/** Part 1 wrapper rendering the 7-column rock chamber for 2,022 falling rocks. */
export function PyroclasticPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <PyroclasticVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (2,022 rocks)"
      targetRocks={PART1_ROCK_COUNT}
    />
  );
}
