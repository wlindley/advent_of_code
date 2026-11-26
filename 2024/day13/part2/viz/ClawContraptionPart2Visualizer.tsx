import type { VisualizerProps } from '../../../../shared/viz';
import { ClawContraptionVisualizer } from '../../shared/viz/ClawContraptionVisualizer';
import { PART2_CONFIG, solver } from '../domain';

/** Part 2 visualizer displaying claw machine button vectors and +10^13 unbounded solutions. */
export function ClawContraptionPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <ClawContraptionVisualizer
      rawInput={rawInput}
      solver={solver}
      config={PART2_CONFIG}
    />
  );
}
