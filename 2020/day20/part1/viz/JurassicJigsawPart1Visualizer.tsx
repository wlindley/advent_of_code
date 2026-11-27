import type { VisualizerProps } from '../../../../shared/viz';
import { JigsawVisualizer } from '../../shared/viz/JigsawVisualizer';
import { solver } from '../domain';

/** Interactive tile-assembly and corner-highlight visualizer for 2020 Day 20 Part 1. */
export function JurassicJigsawPart1Visualizer({ rawInput }: VisualizerProps) {
  return <JigsawVisualizer rawInput={rawInput} solver={solver} />;
}
