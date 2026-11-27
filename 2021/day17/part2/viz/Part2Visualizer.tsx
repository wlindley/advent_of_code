import type { VisualizerProps } from '../../../../shared/viz';
import { TrickShotVisualizer } from '../../shared/viz/TrickShotVisualizer';
import { solver } from '../domain';

/** Part 2 interactive ballistic phase-space sweep and valid velocity visualizer. */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <TrickShotVisualizer rawInput={rawInput} solver={solver} />;
}
