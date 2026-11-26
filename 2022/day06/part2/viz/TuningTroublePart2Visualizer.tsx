import type { VisualizerProps } from '../../../../shared/viz';
import { SignalTapeVisualizer } from '../../shared/viz/SignalTapeVisualizer';
import { solver } from '../domain';

export function TuningTroublePart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <SignalTapeVisualizer
      rawInput={rawInput}
      solver={solver}
      markerLabel="Start-of-Message"
      accentColor="var(--accent)"
    />
  );
}
