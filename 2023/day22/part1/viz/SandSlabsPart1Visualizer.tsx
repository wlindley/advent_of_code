import { SlabVisualizer } from '../../shared/viz/SlabVisualizer';

export interface SandSlabsPart1VisualizerProps {
  readonly rawInput: string;
}

/** Interactive dual-projection visualizer for AoC 2023 Day 22 Part 1. */
export function SandSlabsPart1Visualizer({ rawInput }: SandSlabsPart1VisualizerProps) {
  return <SlabVisualizer rawInput={rawInput} mode="part1" />;
}
