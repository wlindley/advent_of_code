import type { VisualizerProps } from '../../../../shared/viz';
import { WarehouseVisualizer } from '../../shared/viz/WarehouseVisualizer';
import { solver } from '../domain';

/** Interactive step-by-step visualizer for Warehouse Woes Part 2. */
export function WarehousePart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <WarehouseVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (2x crates)"
    />
  );
}
