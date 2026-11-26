import { SlabVisualizer } from '../../shared/viz/SlabVisualizer';

export interface SandSlabsPart2VisualizerProps {
  readonly rawInput: string;
}

/** Interactive dual-projection visualizer for AoC 2023 Day 22 Part 2. */
export function SandSlabsPart2Visualizer({ rawInput }: SandSlabsPart2VisualizerProps) {
  return <SlabVisualizer rawInput={rawInput} mode="part2" />;
}
