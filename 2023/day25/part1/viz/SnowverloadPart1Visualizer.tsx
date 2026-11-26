import { SnowverloadVisualizer } from '../../shared/viz/SnowverloadVisualizer';

export interface SnowverloadPart1VisualizerProps {
  readonly rawInput: string;
}

/** Interactive 3-edge min-cut visualizer for AoC 2023 Day 25 Part 1. */
export function SnowverloadPart1Visualizer({ rawInput }: SnowverloadPart1VisualizerProps) {
  return <SnowverloadVisualizer rawInput={rawInput} />;
}
