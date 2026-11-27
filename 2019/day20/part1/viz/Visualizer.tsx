import type { VisualizerProps } from '../../../../shared/viz';
import { DonutVisualizer } from '../../shared/viz/DonutVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 20 Part 1 interactive Donut Maze visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <DonutVisualizer rawInput={rawInput} solver={solver} />;
}
