import type { VisualizerProps } from '../../../../shared/viz';
import { TractorBeamVisualizer } from '../../shared/viz/TractorBeamVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 19 Part 1 interactive Tractor Beam 50x50 area scan visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <TractorBeamVisualizer rawInput={rawInput} solver={solver} />;
}
