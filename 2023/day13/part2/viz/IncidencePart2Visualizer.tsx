import type { VisualizerProps } from '../../../../shared/viz';
import { IncidenceVisualizer } from '../../shared/viz/IncidenceVisualizer';
import { PART2_TARGET_SMUDGES, solver } from '../domain';

/** Part 2 wrapper binding single-smudge reflections to the shared Point of Incidence visualizer. */
export function IncidencePart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <IncidenceVisualizer
      rawInput={rawInput}
      targetSmudges={PART2_TARGET_SMUDGES}
      solver={solver}
    />
  );
}
