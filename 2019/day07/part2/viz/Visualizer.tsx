import type { VisualizerProps } from '../../../../shared/viz';
import { AmplifierVisualizer } from '../../shared/viz/AmplifierVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 7 Part 2 interactive 5-amplifier feedback loop visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <AmplifierVisualizer rawInput={rawInput} solver={solver} />;
}
