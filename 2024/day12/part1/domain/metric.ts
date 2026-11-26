import { DIRS_4 } from '../../../../shared/core';
import type { GardenMap, GardenRegion, RegionFenceMetric, RegionPartition } from '../../shared';

function measureRegionPerimeter(
  map: GardenMap,
  partition: RegionPartition,
  region: GardenRegion,
): number {
  let perimeter = 0;
  for (const cell of region.cells) {
    const r = map.rowOf(cell);
    const c = map.colOf(cell);
    for (const [dr, dc] of DIRS_4) {
      if (!partition.sameRegion(region.id, r + dr, c + dc)) {
        perimeter += 1;
      }
    }
  }
  return perimeter;
}

/** Part 1 fence metric counting exposed 4-neighborhood boundary edges around a region. */
export const PERIMETER_METRIC: RegionFenceMetric = Object.freeze({
  id: 'perimeter',
  label: 'Perimeter',
  unit: 'edges',
  measure: measureRegionPerimeter,
});
