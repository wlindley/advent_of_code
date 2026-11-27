import type { VisualizerProps } from '../../../../shared/viz';
import { AllergenVisualizer } from '../../shared/viz/AllergenVisualizer';
import { solver } from '../domain';

/** Interactive candidate-intersection visualizer for 2020 Day 21 Part 1. */
export function AllergenPart1Visualizer({ rawInput }: VisualizerProps) {
  return <AllergenVisualizer rawInput={rawInput} solver={solver} />;
}
