import type { VisualizerProps } from '../../../../shared/viz';
import { SignalTapeVisualizer } from '../../shared/viz/SignalTapeVisualizer';
import { solver } from '../domain';

export function TuningTroubleVisualizer({ rawInput }: VisualizerProps) {
  return (
    <SignalTapeVisualizer
      rawInput={rawInput}
      solver={solver}
      markerLabel="Start-of-Packet"
      accentColor="var(--gold)"
    />
  );
}
