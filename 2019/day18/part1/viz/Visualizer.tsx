import type { VisualizerProps } from '../../../../shared/viz';
import { VaultVisualizer } from '../../shared/viz/VaultVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 18 Part 1 interactive vault key-collection visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <VaultVisualizer rawInput={rawInput} solver={solver} />;
}
