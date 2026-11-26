import type { VisualizerProps } from '../../../../shared/viz';
import { CraneBayVisualizer } from '../../shared/viz/CraneBayVisualizer';
import { solver } from '../domain';

export function SupplyStacksVisualizer({ rawInput }: VisualizerProps) {
  return (
    <CraneBayVisualizer
      rawInput={rawInput}
      solver={solver}
      craneLabel="CrateMover 9001"
      craneMode="FIFO · Block"
      accentColor="var(--accent)"
    />
  );
}
