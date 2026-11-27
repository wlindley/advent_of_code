import type { VisualizerProps } from '../../../../shared/viz';
import { OrbitVisualizer } from '../../shared/viz/OrbitVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 12 Part 1 interactive 3D orbital energy visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <OrbitVisualizer rawInput={rawInput} solver={solver} />;
}
