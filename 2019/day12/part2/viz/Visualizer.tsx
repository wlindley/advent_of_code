import type { VisualizerProps } from '../../../../shared/viz';
import { OrbitVisualizer } from '../../shared/viz/OrbitVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 12 Part 2 interactive 3D orbital cycle-period visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <OrbitVisualizer rawInput={rawInput} solver={solver} />;
}
