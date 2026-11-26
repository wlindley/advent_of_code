import type { VisualizerProps } from '../../../../shared/viz';
import type { SpaceImageSolver } from '../../shared';
import { SpaceImageVisualizer } from '../../shared/viz/SpaceImageVisualizer';
import { solver as domainSolver } from '../domain';

export interface Part1VisualizerProps extends VisualizerProps {
  readonly solver?: SpaceImageSolver<number>;
}

/** AoC 2019 Day 8 Part 1 Space Image layer-inspection visualizer. */
export function Visualizer({ rawInput, solver = domainSolver }: Part1VisualizerProps) {
  return <SpaceImageVisualizer rawInput={rawInput} solver={solver} />;
}
