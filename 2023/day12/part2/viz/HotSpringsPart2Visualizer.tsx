import type { VisualizerProps } from '../../../../shared/viz';
import { HotSpringsVisualizer } from '../../shared/viz/HotSpringsVisualizer';
import { PART2_UNFOLD_FACTOR, solver } from '../domain';

/** Part 2 wrapper binding unfold factor 5 to the shared Hot Springs visualizer. */
export function HotSpringsPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <HotSpringsVisualizer
      rawInput={rawInput}
      unfoldFactor={PART2_UNFOLD_FACTOR}
      solver={solver}
    />
  );
}
