import type { VisualizerProps } from '../../../../shared/viz';
import { SIGNAL_DELAY_METRIC } from '../../shared';
import { CrossedWiresVisualizer } from '../../shared/viz/CrossedWiresVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 3 Part 2 interactive Crossed Wires circuit visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <CrossedWiresVisualizer rawInput={rawInput} metric={SIGNAL_DELAY_METRIC} solver={solver} />;
}
