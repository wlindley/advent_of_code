import type { VisualizerProps } from '../../../../shared/viz';
import { StoichiometryVisualizer } from '../../shared/viz/StoichiometryVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 14 Part 1 interactive Space Stoichiometry visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <StoichiometryVisualizer rawInput={rawInput} solver={solver} />;
}
