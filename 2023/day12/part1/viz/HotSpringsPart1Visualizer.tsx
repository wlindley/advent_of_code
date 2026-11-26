import type { VisualizerProps } from '../../../../shared/viz';
import { HotSpringsVisualizer } from '../../shared/viz/HotSpringsVisualizer';
import { PART1_UNFOLD_FACTOR, solver } from '../domain';

/** Part 1 wrapper binding unfold factor 1 to the shared Hot Springs visualizer. */
export function HotSpringsPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <HotSpringsVisualizer
      rawInput={rawInput}
      unfoldFactor={PART1_UNFOLD_FACTOR}
      solver={solver}
    />
  );
}
