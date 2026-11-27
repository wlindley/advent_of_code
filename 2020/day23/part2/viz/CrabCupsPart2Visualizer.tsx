import type { VisualizerProps } from '../../../../shared/viz';
import { CrabCupsVisualizer } from '../../shared/viz/CrabCupsVisualizer';
import { solver } from '../domain';

/** Interactive local-window ribbon visualizer for 2020 Day 23 Part 2. */
export function CrabCupsPart2Visualizer({ rawInput }: VisualizerProps) {
  return <CrabCupsVisualizer rawInput={rawInput} solver={solver} />;
}
