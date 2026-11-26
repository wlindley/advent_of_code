import type { TestArea } from '../../shared';
import { HailVisualizer } from '../../shared/viz/HailVisualizer';

export interface HailPart1VisualizerProps {
  readonly rawInput: string;
  readonly area: TestArea;
}

/** Interactive 2D XY hailstone ray intersection visualizer for AoC 2023 Day 24 Part 1. */
export function HailPart1Visualizer({ rawInput, area }: HailPart1VisualizerProps) {
  return (
    <HailVisualizer
      rawInput={rawInput}
      area={area}
      areaLabel={`Area [${area.min}..${area.max}]`}
    />
  );
}
