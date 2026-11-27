import type { VisualizerProps } from '../../../../shared/viz';
import { SpringdroidVisualizer } from '../../shared/viz/SpringdroidVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 21 Part 1 interactive Springdroid WALK visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <SpringdroidVisualizer rawInput={rawInput} solver={solver} />;
}
