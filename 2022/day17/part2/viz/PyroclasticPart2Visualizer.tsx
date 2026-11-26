import type { VisualizerProps } from '../../../../shared/viz';
import { PyroclasticVisualizer } from '../../shared/viz/PyroclasticVisualizer';
import { PART2_ROCK_COUNT, solver } from '../domain';

/** Part 2 wrapper rendering the 7-column rock chamber for 1,000,000,000,000 falling rocks. */
export function PyroclasticPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <PyroclasticVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (1,000,000,000,000 rocks)"
      targetRocks={PART2_ROCK_COUNT}
    />
  );
}
