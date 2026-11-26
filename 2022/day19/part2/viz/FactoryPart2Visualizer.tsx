import type { VisualizerProps } from '../../../../shared/viz';
import { FactoryVisualizer } from '../../shared/viz/FactoryVisualizer';
import { solver } from '../domain';

/** Part 2 visualizer animating 32-minute blueprint build timelines and geode product. */
export function FactoryPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <FactoryVisualizer
      rawInput={rawInput}
      solver={solver}
      timeLimit={32}
      mode="geode-product"
      partLabel="Part 2 (32 min)"
    />
  );
}
