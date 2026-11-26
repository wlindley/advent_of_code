import type { GardenMap, GardenRegion, RegionFenceMetric, RegionPartition } from '../../shared';

const CORNER_QUADRANTS = [
  [-1, -1],
  [-1, 1],
  [1, 1],
  [1, -1],
] as const;

function countCellCorners(
  partition: RegionPartition,
  regionId: number,
  row: number,
  col: number,
): number {
  let corners = 0;
  for (const [dr, dc] of CORNER_QUADRANTS) {
    const sameV = partition.sameRegion(regionId, row + dr, col);
    const sameH = partition.sameRegion(regionId, row, col + dc);
    if (!sameV && !sameH) {
      corners += 1;
    } else if (sameV && sameH && !partition.sameRegion(regionId, row + dr, col + dc)) {
      corners += 1;
    }
  }
  return corners;
}

function measureRegionSides(
  map: GardenMap,
  partition: RegionPartition,
  region: GardenRegion,
): number {
  let sides = 0;
  for (const cell of region.cells) {
    sides += countCellCorners(partition, region.id, map.rowOf(cell), map.colOf(cell));
  }
  return sides;
}

/** Part 2 fence metric counting straight sides via convex and concave cell corners. */
export const SIDES_METRIC: RegionFenceMetric = Object.freeze({
  id: 'sides',
  label: 'Sides',
  unit: 'sides',
  measure: measureRegionSides,
});
