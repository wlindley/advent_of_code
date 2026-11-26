import type { VisualizerProps } from '../../../../shared/viz';
import type { DiffusionFrame } from '../../shared';
import { DiffusionVisualizer } from '../../shared/viz/DiffusionVisualizer';
import { solver } from '../domain';

function formatPart2Answer(frame: DiffusionFrame, finalFrame: DiffusionFrame): string {
  return frame.round === finalFrame.round
    ? `Static at round: ${finalFrame.round}`
    : `Round ${frame.round} (static at ${finalFrame.round})`;
}

/** Part 2 interactive visualizer showing Unstable Diffusion until static equilibrium. */
export function DiffusionPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <DiffusionVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (Until Static)"
      formatAnswer={formatPart2Answer}
    />
  );
}
