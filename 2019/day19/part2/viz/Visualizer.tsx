import type { VisualizerProps } from '../../../../shared/viz';
import { TractorBeamVisualizer } from '../../shared/viz/TractorBeamVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 19 Part 2 interactive Tractor Beam 100x100 closest-square visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <TractorBeamVisualizer rawInput={rawInput} solver={solver} />;
}
