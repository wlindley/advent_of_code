import type { VisualizerProps } from '../../../../shared/viz';
import { ArcadeCabinetVisualizer } from '../../shared/viz/ArcadeCabinetVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 13 Part 2 interactive Care Package arcade cabinet visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <ArcadeCabinetVisualizer rawInput={rawInput} solver={solver} />;
}
