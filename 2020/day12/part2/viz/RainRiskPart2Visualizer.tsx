import type { VisualizerProps } from '../../../../shared/viz';
import { NavigationVisualizer } from '../../shared/viz/NavigationVisualizer';
import { solver } from '../domain';

/** Interactive Part 2 nautical course visualizer using waypoint-based steering. */
export function RainRiskPart2Visualizer({ rawInput }: VisualizerProps) {
  return <NavigationVisualizer rawInput={rawInput} solver={solver} />;
}
