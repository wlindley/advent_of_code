import { GardenVisualizer } from '../../shared/viz/GardenVisualizer';

export interface GardenPart1VisualizerProps {
  readonly rawInput: string;
  readonly steps: number;
}

/** Interactive finite-grid garden BFS visualizer for AoC 2023 Day 21 Part 1. */
export function GardenPart1Visualizer({ rawInput, steps }: GardenPart1VisualizerProps) {
  return (
    <GardenVisualizer
      rawInput={rawInput}
      steps={steps}
      partLabel={`Part 1 (${steps} Steps)`}
    />
  );
}
