import type { VisualizerProps } from '../../../../shared/viz';
import { IncidenceVisualizer } from '../../shared/viz/IncidenceVisualizer';
import { PART1_TARGET_SMUDGES, solver } from '../domain';

/** Part 1 wrapper binding zero-smudge reflections to the shared Point of Incidence visualizer. */
export function IncidencePart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <IncidenceVisualizer
      rawInput={rawInput}
      targetSmudges={PART1_TARGET_SMUDGES}
      solver={solver}
    />
  );
}
