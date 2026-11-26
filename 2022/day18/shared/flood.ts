import {
  CELL_EMPTY, CELL_EXTERIOR, CELL_TRAPPED_AIR, type CellKind, validateSliceIndex, type VoxelDroplet,
} from './droplet';

interface FloodBuffers {
  readonly cells: Uint8Array; readonly waves: Int32Array; readonly queue: Int32Array;
  readonly sizeX: number; readonly sizeY: number; readonly sizeZ: number; readonly strideZ: number;
}

export function visitNeighbor(
  cells: Uint8Array, waves: Int32Array, queue: Int32Array, tail: number, neighborIdx: number, nextWave: number,
): number {
  if (cells[neighborIdx]! !== CELL_EMPTY) return tail;
  cells[neighborIdx] = CELL_EXTERIOR;
  waves[neighborIdx] = nextWave;
  queue[tail] = neighborIdx;
  return tail + 1;
}

export function expandNeighbors(buf: FloodBuffers, tail: number, idx: number, nextWave: number): number {
  const { cells, waves, queue, sizeX, sizeY, sizeZ, strideZ } = buf;
  const lx = idx % sizeX;
  const ly = Math.floor((idx % strideZ) / sizeX);
  const lz = Math.floor(idx / strideZ);
  let nextTail = tail;

  if (lx > 0) nextTail = visitNeighbor(cells, waves, queue, nextTail, idx - 1, nextWave);
  if (lx + 1 < sizeX) nextTail = visitNeighbor(cells, waves, queue, nextTail, idx + 1, nextWave);
  if (ly > 0) nextTail = visitNeighbor(cells, waves, queue, nextTail, idx - sizeX, nextWave);
  if (ly + 1 < sizeY) nextTail = visitNeighbor(cells, waves, queue, nextTail, idx + sizeX, nextWave);
  if (lz > 0) nextTail = visitNeighbor(cells, waves, queue, nextTail, idx - strideZ, nextWave);
  if (lz + 1 < sizeZ) nextTail = visitNeighbor(cells, waves, queue, nextTail, idx + strideZ, nextWave);
  return nextTail;
}

export function markTrappedAir(cells: Uint8Array): void {
  for (let i = 0; i < cells.length; i += 1) {
    if (cells[i]! === CELL_EMPTY) cells[i] = CELL_TRAPPED_AIR;
  }
}

function countCellsOfKind(cells: Uint8Array, target: CellKind): number {
  let count = 0;
  for (let i = 0; i < cells.length; i += 1) if (cells[i]! === target) count += 1;
  return count;
}

/** Immutable 6-connected exterior flood-fill result over a padded `VoxelDroplet`. */
export class ExteriorFlood {
  readonly #droplet: VoxelDroplet;
  readonly #cells: Uint8Array;
  readonly #waves: Int32Array;

  private constructor(droplet: VoxelDroplet, cells: Uint8Array, waves: Int32Array) {
    this.#droplet = droplet;
    this.#cells = cells;
    this.#waves = waves;
    Object.freeze(this);
  }

  static compute(droplet: VoxelDroplet): ExteriorFlood {
    const cells = droplet.cloneOccupancy(), vol = droplet.volume;
    const waves = new Int32Array(vol).fill(-1), queue = new Int32Array(vol);
    const buf: FloodBuffers = {
      cells, waves, queue, sizeX: droplet.sizeX, sizeY: droplet.sizeY,
      sizeZ: droplet.sizeZ, strideZ: droplet.sizeX * droplet.sizeY,
    };
    cells[0] = CELL_EXTERIOR;
    waves[0] = 0;
    queue[0] = 0;
    let head = 0, tail = 1;
    while (head < tail) {
      const idx = queue[head++]!;
      tail = expandNeighbors(buf, tail, idx, waves[idx]! + 1);
    }
    markTrappedAir(cells);
    return new ExteriorFlood(droplet, cells, waves);
  }

  get droplet(): VoxelDroplet { return this.#droplet; }
  get exteriorSurfaceArea(): number { return this.#droplet.countFacesAgainst(this.#cells, CELL_EXTERIOR); }
  get trappedSurfaceArea(): number { return this.#droplet.countFacesAgainst(this.#cells, CELL_TRAPPED_AIR); }
  get trappedAirCount(): number { return countCellsOfKind(this.#cells, CELL_TRAPPED_AIR); }
  get exteriorAirCount(): number { return countCellsOfKind(this.#cells, CELL_EXTERIOR); }

  get maxWave(): number {
    let max = 0;
    for (let i = 0; i < this.#waves.length; i += 1) if (this.#waves[i]! > max) max = this.#waves[i]!;
    return max;
  }

  cloneCells(): Uint8Array { return this.#cells.slice(); }
  cloneWaves(): Int32Array { return this.#waves.slice(); }

  sliceCells(lz: number): Uint8Array {
    validateSliceIndex(lz, this.#droplet.sizeZ);
    const plane = this.#droplet.sizeX * this.#droplet.sizeY, start = lz * plane;
    return this.#cells.slice(start, start + plane);
  }
}
