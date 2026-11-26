import type { VisualizerProps } from '../../../../shared/viz';
import { FactoryVisualizer } from '../../shared/viz/FactoryVisualizer';
import { solver } from '../domain';

/** Part 1 visualizer animating 24-minute blueprint build timelines and quality-level sum. */
export function FactoryPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <FactoryVisualizer
      rawInput={rawInput}
      solver={solver}
      timeLimit={24}
      mode="quality-sum"
      partLabel="Part 1 (24 min)"
    />
  );
}
