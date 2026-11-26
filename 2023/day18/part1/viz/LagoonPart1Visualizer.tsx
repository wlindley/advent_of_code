import type { VisualizerProps } from '../../../../shared/viz';
import { LagoonPolygonVisualizer } from '../../shared/viz/LagoonPolygonVisualizer';
import { solver } from '../domain';

/** Interactive Shoelace & Pick's theorem visualizer for AoC 2023 Day 18 Part 1. */
export function LagoonPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <LagoonPolygonVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (Direct Plan)"
    />
  );
}
