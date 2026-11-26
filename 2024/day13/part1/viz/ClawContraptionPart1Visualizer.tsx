import type { VisualizerProps } from '../../../../shared/viz';
import { ClawContraptionVisualizer } from '../../shared/viz/ClawContraptionVisualizer';
import { PART1_CONFIG, solver } from '../domain';

/** Part 1 visualizer displaying claw machine button vectors and press-capped solutions. */
export function ClawContraptionPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <ClawContraptionVisualizer
      rawInput={rawInput}
      solver={solver}
      config={PART1_CONFIG}
    />
  );
}
