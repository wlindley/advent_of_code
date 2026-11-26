import { DIRS_4 } from '../../../shared/core';
import { type GardenMap, isValidPlant } from './map';

/** Immutable 4-connected garden region sharing a single plant type. */
export class GardenRegion {
  readonly id: number;
  readonly plant: string;
  readonly cells: readonly number[];

  constructor(id: number, plant: string, cells: readonly number[]) {
    if (!Number.isInteger(id) || id < 0) {
      throw new RangeError(`Region id must be a non-negative integer, got ${id}`);
    }
    if (!isValidPlant(plant)) {
      throw new Error(`Invalid region plant "${plant}"`);
    }
    if (cells.length === 0) {
      throw new Error('Region must contain at least one cell');
    }
    this.id = id;
    this.plant = plant;
    this.cells = Object.freeze(cells.slice());
    Object.freeze(this);
  }

  get area(): number {
    return this.cells.length;
  }
}

/** Immutable partitioning of a `GardenMap` into 4-connected `GardenRegion`s. */
export class RegionPartition {
  readonly map: GardenMap;
  readonly regions: readonly GardenRegion[];
  private readonly regionIdByCell: Int32Array;

  constructor(map: GardenMap, regions: readonly GardenRegion[], regionIdByCell: Int32Array) {
    if (regionIdByCell.length !== map.size) {
      throw new RangeError(
        `Expected ${map.size} cell region ids for ${map.rows}x${map.cols} map, got ${regionIdByCell.length}`,
      );
    }
    if (regions.length === 0) {
      throw new Error('Partition must contain at least one region');
    }
    this.map = map;
    this.regions = Object.freeze(regions.slice());
    this.regionIdByCell = new Int32Array(regionIdByCell);
    Object.freeze(this);
  }

  regionIdAt(row: number, col: number): number {
    return this.regionIdByCell[this.map.indexOf(row, col)]!;
  }

  sameRegion(regionId: number, row: number, col: number): boolean {
    return this.map.inBounds(row, col) && this.regionIdByCell[this.map.indexOf(row, col)] === regionId;
  }
}

function floodFillRegion(
  map: GardenMap,
  regionIdByCell: Int32Array,
  queue: Int32Array,
  startIndex: number,
  regionId: number,
): GardenRegion {
  const plant = map.plantAt(map.rowOf(startIndex), map.colOf(startIndex));
  const cells: number[] = [];
  let head = 0;
  let tail = 0;
  regionIdByCell[startIndex] = regionId;
  queue[tail++] = startIndex;

  while (head < tail) {
    const curr = queue[head++]!;
    cells.push(curr);
    const r = map.rowOf(curr);
    const c = map.colOf(curr);
    for (const [dr, dc] of DIRS_4) {
      const nr = r + dr;
      const nc = c + dc;
      if (!map.inBounds(nr, nc)) continue;
      const next = map.indexOf(nr, nc);
      if (regionIdByCell[next] !== -1 || map.plantAt(nr, nc) !== plant) continue;
      regionIdByCell[next] = regionId;
      queue[tail++] = next;
    }
  }
  return new GardenRegion(regionId, plant, cells);
}

/** Partitions `map` into maximal 4-connected plant regions in deterministic row-major order. */
export function partitionGarden(map: GardenMap): RegionPartition {
  const regionIdByCell = new Int32Array(map.size).fill(-1);
  const queue = new Int32Array(map.size);
  const regions: GardenRegion[] = [];

  for (let start = 0; start < map.size; start += 1) {
    if (regionIdByCell[start] !== -1) continue;
    regions.push(floodFillRegion(map, regionIdByCell, queue, start, regions.length));
  }
  return new RegionPartition(map, regions, regionIdByCell);
}
