import type { VisualizerProps } from '../../../../shared/viz';
import type { SpaceImageSolver } from '../../shared';
import { SpaceImageVisualizer } from '../../shared/viz/SpaceImageVisualizer';
import { solver as domainSolver } from '../domain';

export interface Part2VisualizerProps extends VisualizerProps {
  readonly solver?: SpaceImageSolver<string>;
}

/** AoC 2019 Day 8 Part 2 Space Image composite OCR visualizer. */
export function Visualizer({ rawInput, solver = domainSolver }: Part2VisualizerProps) {
  return <SpaceImageVisualizer rawInput={rawInput} solver={solver} />;
}
