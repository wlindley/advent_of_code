import type { VisualizerProps } from '../../../../shared/viz';
import { AmplifierVisualizer } from '../../shared/viz/AmplifierVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 7 Part 1 interactive 5-amplifier series chain visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <AmplifierVisualizer rawInput={rawInput} solver={solver} />;
}
