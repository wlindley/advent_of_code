import type { VisualizerProps } from '../../../../shared/viz';
import { AllergenVisualizer } from '../../shared/viz/AllergenVisualizer';
import { solver } from '../domain';

/** Interactive singleton-peeling visualizer for 2020 Day 21 Part 2. */
export function AllergenPart2Visualizer({ rawInput }: VisualizerProps) {
  return <AllergenVisualizer rawInput={rawInput} solver={solver} />;
}
