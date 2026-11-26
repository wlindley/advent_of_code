import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import {
  CELL_EMPTY,
  CELL_EXTERIOR,
  CELL_TRAPPED_AIR,
  type CellKind,
  type SliceSummary,
  type VoxelDroplet,
} from './droplet';
import { ExteriorFlood } from './flood';

export const DEFAULT_TRACE_MAX_STEPS = 60;

export type DropletTraceMode = 'total' | 'exterior';

export interface DropletTraceFrame {
  readonly mode: DropletTraceMode;
  readonly droplet: VoxelDroplet;
  readonly activeLz: number;
  readonly worldZ: number;
  readonly sliceLavaCount: number;
  readonly sliceExposedFaces: number;
  readonly cumulativeLavaCount: number;
  readonly cumulativeExposedFaces: number;
  readonly totalSurfaceArea: number;
  readonly trappedAirCount: number;
  readonly trappedSurfaceArea: number;
  readonly sliceCells: Uint8Array;
}

function countTrappedAir(cells: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < cells.length; i += 1) {
    if (cells[i]! === CELL_TRAPPED_AIR) count += 1;
  }
  return count;
}

function accumulateTotals(summaries: readonly SliceSummary[]): {
  readonly cumLava: Int32Array;
  readonly cumFaces: Int32Array;
} {
  const cumLava = new Int32Array(summaries.length);
  const cumFaces = new Int32Array(summaries.length);
  let lava = 0;
  let faces = 0;
  for (let i = 0; i < summaries.length; i += 1) {
    const s = summaries[i]!;
    lava += s.lavaCount;
    faces += s.exposedFaces;
    cumLava[i] = lava;
    cumFaces[i] = faces;
  }
  return { cumLava, cumFaces };
}

function buildSliceFrames(
  droplet: VoxelDroplet,
  mode: DropletTraceMode,
  cells: Uint8Array,
  target: CellKind,
  options?: TraceOptions,
): readonly DropletTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const summaries = droplet.summarizeSlices(cells, target);
  const { cumLava, cumFaces } = accumulateTotals(summaries);
  const totalSurfaceArea = cumFaces[summaries.length - 1]!;
  const trappedAirCount = mode === 'exterior' ? countTrappedAir(cells) : 0;
  const trappedSurfaceArea = mode === 'exterior' ? droplet.countFacesAgainst(cells, CELL_TRAPPED_AIR) : 0;
  const sampled = sampleTraceIndices(summaries.length, maxSteps);
  const planeSize = droplet.sizeX * droplet.sizeY;
  const frames: DropletTraceFrame[] = [];

  for (const idx of sampled) {
    const s = summaries[idx]!;
    const start = s.lz * planeSize;
    frames.push(Object.freeze({
      mode,
      droplet,
      activeLz: s.lz,
      worldZ: s.worldZ,
      sliceLavaCount: s.lavaCount,
      sliceExposedFaces: s.exposedFaces,
      cumulativeLavaCount: cumLava[idx]!,
      cumulativeExposedFaces: cumFaces[idx]!,
      totalSurfaceArea,
      trappedAirCount,
      trappedSurfaceArea,
      sliceCells: cells.slice(start, start + planeSize),
    }));
  }
  return Object.freeze(frames);
}

/** Builds Z-slice trace frames counting all exposed lava faces (Part 1). */
export function traceTotalSurface(droplet: VoxelDroplet, options?: TraceOptions): readonly DropletTraceFrame[] {
  return buildSliceFrames(droplet, 'total', droplet.cloneOccupancy(), CELL_EMPTY, options);
}

/** Builds Z-slice trace frames counting only exterior-reachable faces (Part 2). */
export function traceExteriorSurface(droplet: VoxelDroplet, options?: TraceOptions): readonly DropletTraceFrame[] {
  const flood = ExteriorFlood.compute(droplet);
  return buildSliceFrames(droplet, 'exterior', flood.cloneCells(), CELL_EXTERIOR, options);
}
