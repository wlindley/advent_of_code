import type { VisualizerProps } from '../../../../shared/viz';
import { ScaffoldVisualizer } from '../../shared/viz/ScaffoldVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 17 Part 1 interactive Set and Forget scaffold visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <ScaffoldVisualizer rawInput={rawInput} solver={solver} />;
}
