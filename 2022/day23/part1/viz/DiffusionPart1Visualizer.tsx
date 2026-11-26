import type { VisualizerProps } from '../../../../shared/viz';
import type { DiffusionFrame } from '../../shared';
import { DiffusionVisualizer } from '../../shared/viz/DiffusionVisualizer';
import { solver } from '../domain';

function formatPart1Answer(frame: DiffusionFrame, finalFrame: DiffusionFrame): string {
  return frame.round === finalFrame.round
    ? `Empty tiles: ${frame.emptyGroundCount}`
    : `Empty tiles: ${frame.emptyGroundCount} (final ${finalFrame.emptyGroundCount})`;
}

/** Part 1 interactive visualizer showing 10-round Unstable Diffusion. */
export function DiffusionPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <DiffusionVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (10 Rounds)"
      formatAnswer={formatPart1Answer}
    />
  );
}
