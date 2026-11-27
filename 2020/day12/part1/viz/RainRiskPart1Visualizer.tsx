import type { VisualizerProps } from '../../../../shared/viz';
import { NavigationVisualizer } from '../../shared/viz/NavigationVisualizer';
import { solver } from '../domain';

/** Interactive Part 1 nautical course visualizer using heading-based steering. */
export function RainRiskPart1Visualizer({ rawInput }: VisualizerProps) {
  return <NavigationVisualizer rawInput={rawInput} solver={solver} />;
}
