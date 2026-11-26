import type { VisualizerProps } from '../../../../shared/viz';
import { ResonanceVisualizer } from '../../shared/viz/ResonanceVisualizer';
import { DOUBLE_DISTANCE_RULE } from '../domain';

/** Part 1 visualizer binding the double-distance exterior reflection rule. */
export function ResonancePart1Visualizer({ rawInput }: VisualizerProps) {
  return <ResonanceVisualizer rawInput={rawInput} rule={DOUBLE_DISTANCE_RULE} />;
}
