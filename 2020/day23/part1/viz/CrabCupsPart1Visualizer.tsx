import type { VisualizerProps } from '../../../../shared/viz';
import { CrabCupsVisualizer } from '../../shared/viz/CrabCupsVisualizer';
import { solver } from '../domain';

/** Interactive circular-ring visualizer for 2020 Day 23 Part 1. */
export function CrabCupsPart1Visualizer({ rawInput }: VisualizerProps) {
  return <CrabCupsVisualizer rawInput={rawInput} solver={solver} />;
}
