import type { VisualizerProps } from '../../../../shared/viz';
import { TrickShotVisualizer } from '../../shared/viz/TrickShotVisualizer';
import { solver } from '../domain';

/** Part 1 interactive ballistic sweep and max-apex trajectory visualizer. */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <TrickShotVisualizer rawInput={rawInput} solver={solver} />;
}
