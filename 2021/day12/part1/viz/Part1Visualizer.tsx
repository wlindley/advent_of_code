import type { VisualizerProps } from '../../../../shared/viz';
import { CaveVisualizer } from '../../shared/viz/CaveVisualizer';
import { solver } from '../domain';

/** Interactive visualization wrapper for 2021 Day 12 Part 1. */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <CaveVisualizer rawInput={rawInput} solver={solver} />;
}
