import { TrailVisualizer } from '../../shared/viz/TrailVisualizer';

export interface LongWalkPart1VisualizerProps {
  readonly rawInput: string;
}

/** Interactive trail contraction and icy-slope longest walk visualizer for AoC 2023 Day 23 Part 1. */
export function LongWalkPart1Visualizer({ rawInput }: LongWalkPart1VisualizerProps) {
  return <TrailVisualizer rawInput={rawInput} ignoreSlopes={false} />;
}
