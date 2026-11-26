import { TrailVisualizer } from '../../shared/viz/TrailVisualizer';

export interface LongWalkPart2VisualizerProps {
  readonly rawInput: string;
}

/** Interactive trail contraction and slope-ignoring longest walk visualizer for AoC 2023 Day 23 Part 2. */
export function LongWalkPart2Visualizer({ rawInput }: LongWalkPart2VisualizerProps) {
  return <TrailVisualizer rawInput={rawInput} ignoreSlopes={true} />;
}
