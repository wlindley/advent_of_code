import type { VisualizerProps } from '../../../../shared/viz';
import { BoostVisualizer } from '../../shared/viz/BoostVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 9 Part 2 interactive complete-Intcode Sensor Boost debugger. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <BoostVisualizer rawInput={rawInput} solver={solver} />;
}
