import type { VisualizerProps } from '../../../../shared/viz';
import { MANHATTAN_METRIC } from '../../shared';
import { CrossedWiresVisualizer } from '../../shared/viz/CrossedWiresVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 3 Part 1 interactive Crossed Wires circuit visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <CrossedWiresVisualizer rawInput={rawInput} metric={MANHATTAN_METRIC} solver={solver} />;
}
