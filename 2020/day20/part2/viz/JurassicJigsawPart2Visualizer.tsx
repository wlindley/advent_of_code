import type { VisualizerProps } from '../../../../shared/viz';
import { JigsawVisualizer } from '../../shared/viz/JigsawVisualizer';
import { solver } from '../domain';

/** Interactive tile-assembly, stitching, and sea-monster visualizer for 2020 Day 20 Part 2. */
export function JurassicJigsawPart2Visualizer({ rawInput }: VisualizerProps) {
  return <JigsawVisualizer rawInput={rawInput} solver={solver} />;
}
