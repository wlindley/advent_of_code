export const CELL_EMPTY = 0 as const;
export const CELL_LAVA = 1 as const;
export const CELL_EXTERIOR = 2 as const;
export const CELL_TRAPPED_AIR = 3 as const;
export const MAX_GRID_VOLUME = 2_000_000;

export type CellKind = 0 | 1 | 2 | 3;
export interface VoxelCoord { readonly x: number; readonly y: number; readonly z: number; }
export interface VoxelBounds {
  readonly minX: number; readonly maxX: number;
  readonly minY: number; readonly maxY: number;
  readonly minZ: number; readonly maxZ: number;
}
export interface SliceSummary {
  readonly lz: number; readonly worldZ: number;
  readonly lavaCount: number; readonly exposedFaces: number;
}
interface GridDimensions {
  readonly originX: number; readonly originY: number; readonly originZ: number;
  readonly sizeX: number; readonly sizeY: number; readonly sizeZ: number; readonly volume: number;
}

export function assertSafeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${label} must be a safe integer, got ${value}`);
  return value === 0 ? 0 : value;
}

export function computeBounds(coords: readonly VoxelCoord[]): VoxelBounds {
  const first = coords[0];
  if (!first) throw new RangeError('Droplet requires at least one voxel coordinate');
  let minX = assertSafeInt(first.x, 'x'), maxX = minX;
  let minY = assertSafeInt(first.y, 'y'), maxY = minY;
  let minZ = assertSafeInt(first.z, 'z'), maxZ = minZ;
  for (let i = 1; i < coords.length; i += 1) {
    const c = coords[i]!;
    const x = assertSafeInt(c.x, 'x'), y = assertSafeInt(c.y, 'y'), z = assertSafeInt(c.z, 'z');
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  return Object.freeze({ minX, maxX, minY, maxY, minZ, maxZ });
}

export function computeGridDimensions(bounds: VoxelBounds): GridDimensions {
  const dx = BigInt(bounds.maxX) - BigInt(bounds.minX) + 3n;
  const dy = BigInt(bounds.maxY) - BigInt(bounds.minY) + 3n;
  const dz = BigInt(bounds.maxZ) - BigInt(bounds.minZ) + 3n;
  const vol = dx * dy * dz;
  if (vol > BigInt(MAX_GRID_VOLUME)) {
    throw new RangeError(`Bounding grid volume ${vol} exceeds limit ${MAX_GRID_VOLUME}`);
  }
  return {
    originX: bounds.minX - 1, originY: bounds.minY - 1, originZ: bounds.minZ - 1,
    sizeX: Number(dx), sizeY: Number(dy), sizeZ: Number(dz), volume: Number(vol),
  };
}

export function countNeighbors(cells: Uint8Array, idx: number, sy: number, sz: number, target: CellKind): number {
  return (
    (cells[idx - 1]! === target ? 1 : 0) + (cells[idx + 1]! === target ? 1 : 0) +
    (cells[idx - sy]! === target ? 1 : 0) + (cells[idx + sy]! === target ? 1 : 0) +
    (cells[idx - sz]! === target ? 1 : 0) + (cells[idx + sz]! === target ? 1 : 0)
  );
}

export function validateSliceIndex(lz: number, sizeZ: number): number {
  if (!Number.isInteger(lz) || lz < 0 || lz >= sizeZ) {
    throw new RangeError(`Slice index ${lz} out of bounds [0, ${sizeZ - 1}]`);
  }
  return lz;
}

/** Immutable 3D voxel grid padded by a 1-cell exterior air shell on all 6 faces. */
export class VoxelDroplet {
  readonly bounds: VoxelBounds;
  readonly originX: number; readonly originY: number; readonly originZ: number;
  readonly sizeX: number; readonly sizeY: number; readonly sizeZ: number;
  readonly #occupancy: Uint8Array;
  readonly #lavaIndices: Int32Array;

  private constructor(bounds: VoxelBounds, dims: GridDimensions, occupancy: Uint8Array, lavaIndices: Int32Array) {
    this.bounds = bounds;
    this.originX = dims.originX; this.originY = dims.originY; this.originZ = dims.originZ;
    this.sizeX = dims.sizeX; this.sizeY = dims.sizeY; this.sizeZ = dims.sizeZ;
    this.#occupancy = occupancy;
    this.#lavaIndices = lavaIndices;
    Object.freeze(this);
  }

  static fromCoords(coords: readonly VoxelCoord[]): VoxelDroplet {
    const bounds = computeBounds(coords);
    const dims = computeGridDimensions(bounds);
    const occupancy = new Uint8Array(dims.volume);
    const lavaList: number[] = [];
    const sz = dims.sizeX * dims.sizeY;
    for (const c of coords) {
      const idx = (c.x - dims.originX) + (c.y - dims.originY) * dims.sizeX + (c.z - dims.originZ) * sz;
      if (occupancy[idx]! === CELL_EMPTY) {
        occupancy[idx] = CELL_LAVA;
        lavaList.push(idx);
      }
    }
    return new VoxelDroplet(bounds, dims, occupancy, Int32Array.from(lavaList));
  }

  get volume(): number { return this.sizeX * this.sizeY * this.sizeZ; }
  get cubeCount(): number { return this.#lavaIndices.length; }
  get totalSurfaceArea(): number { return this.countFacesAgainst(this.#occupancy, CELL_EMPTY); }
  cloneOccupancy(): Uint8Array { return this.#occupancy.slice(); }

  countFacesAgainst(cells: Uint8Array, target: CellKind): number {
    if (cells.length !== this.volume) throw new RangeError(`Expected ${this.volume} cells, got ${cells.length}`);
    const sy = this.sizeX, sz = this.sizeX * this.sizeY;
    let total = 0;
    for (let i = 0; i < this.#lavaIndices.length; i += 1) total += countNeighbors(cells, this.#lavaIndices[i]!, sy, sz, target);
    return total;
  }

  summarizeSlices(cells: Uint8Array, target: CellKind): readonly SliceSummary[] {
    if (cells.length !== this.volume) throw new RangeError(`Expected ${this.volume} cells, got ${cells.length}`);
    const sy = this.sizeX, sz = this.sizeX * this.sizeY;
    const lavaCounts = new Int32Array(this.sizeZ), faceCounts = new Int32Array(this.sizeZ);
    for (let i = 0; i < this.#lavaIndices.length; i += 1) {
      const idx = this.#lavaIndices[i]!, lz = Math.floor(idx / sz);
      lavaCounts[lz]! += 1;
      faceCounts[lz]! += countNeighbors(cells, idx, sy, sz, target);
    }
    const summaries: SliceSummary[] = [];
    for (let lz = 1; lz <= this.sizeZ - 2; lz += 1) {
      summaries.push({ lz, worldZ: this.originZ + lz, lavaCount: lavaCounts[lz]!, exposedFaces: faceCounts[lz]! });
    }
    return Object.freeze(summaries);
  }

  sliceOccupancy(lz: number): Uint8Array {
    validateSliceIndex(lz, this.sizeZ);
    const sz = this.sizeX * this.sizeY, start = lz * sz;
    return this.#occupancy.slice(start, start + sz);
  }
}
