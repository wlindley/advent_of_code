import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { type AssembledGrid, assembleGrid } from './assembler';
import type { SquareBitmap } from './d4';
import { type SeaMonsterScan, scanSeaMonsters } from './monsters';
import type { JigsawPuzzle } from './parser';
import type { JigsawMode } from './policies';

export const DEFAULT_MAX_TRACE_STEPS = 160;
export type JigsawPhase = 'assemble' | 'corners' | 'stitch' | 'monsters';
/** 0: unplaced, 1: '.', 2: '#', 3: corner '#', 4: sea-monster '#'. */
export type JigsawCellCode = 0 | 1 | 2 | 3 | 4;

export interface JigsawTraceFrame {
  readonly phase: JigsawPhase;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly placedCount: number;
  readonly totalTiles: number;
  readonly gridSide: number;
  readonly tileSize: number;
  readonly pixelSide: number;
  readonly borderless: boolean;
  readonly activeTileId: number;
  readonly cornerIds: readonly [number, number, number, number];
  readonly cornerProduct: bigint;
  readonly monsterCount: number | undefined;
  readonly waterRoughness: number | undefined;
  cellCodeAt(r: number, c: number): JigsawCellCode;
}

class TiledTraceFrame implements JigsawTraceFrame {
  readonly phase: 'assemble' | 'corners';
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly placedCount: number;
  readonly totalTiles: number;
  readonly gridSide: number;
  readonly tileSize: number;
  readonly pixelSide: number;
  readonly borderless = false;
  readonly activeTileId: number;
  readonly cornerIds: readonly [number, number, number, number];
  readonly cornerProduct: bigint;
  readonly monsterCount = undefined;
  readonly waterRoughness = undefined;
  private readonly grid: AssembledGrid;

  constructor(grid: AssembledGrid, phase: 'assemble' | 'corners', stepIndex: number, totalSteps: number, placedCount: number) {
    this.grid = grid;
    this.phase = phase;
    this.stepIndex = stepIndex;
    this.totalSteps = totalSteps;
    this.placedCount = placedCount;
    this.totalTiles = grid.placements.length;
    this.gridSide = grid.gridSide;
    this.tileSize = grid.tileSize;
    this.pixelSide = grid.gridSide * grid.tileSize;
    this.activeTileId = grid.placements[placedCount - 1]!.tileId;
    this.cornerIds = grid.cornerIds;
    this.cornerProduct = grid.cornerProduct;
  }

  cellCodeAt(r: number, c: number): JigsawCellCode {
    const tr = Math.floor(r / this.tileSize);
    const tc = Math.floor(c / this.tileSize);
    if (tr * this.gridSide + tc >= this.placedCount) return 0;
    const bit = this.grid.pixelAt(tr, tc, r % this.tileSize, c % this.tileSize);
    if (bit === 0) return 1;
    return this.phase === 'corners' && this.grid.isCorner(tr, tc) ? 3 : 2;
  }
}

class StitchedTraceFrame implements JigsawTraceFrame {
  readonly phase: 'stitch' | 'monsters';
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly placedCount: number;
  readonly totalTiles: number;
  readonly gridSide: number;
  readonly tileSize: number;
  readonly pixelSide: number;
  readonly borderless = true;
  readonly activeTileId: number;
  readonly cornerIds: readonly [number, number, number, number];
  readonly cornerProduct: bigint;
  readonly monsterCount: number | undefined;
  readonly waterRoughness: number | undefined;
  private readonly bitmap: SquareBitmap;
  private readonly scan: SeaMonsterScan | undefined;

  constructor(grid: AssembledGrid, bitmap: SquareBitmap, scan: SeaMonsterScan | undefined, stepIndex: number, totalSteps: number) {
    this.phase = scan === undefined ? 'stitch' : 'monsters';
    this.stepIndex = stepIndex;
    this.totalSteps = totalSteps;
    this.placedCount = grid.placements.length;
    this.totalTiles = grid.placements.length;
    this.gridSide = grid.gridSide;
    this.tileSize = grid.tileSize;
    this.pixelSide = bitmap.side;
    this.activeTileId = grid.placements[grid.placements.length - 1]!.tileId;
    this.cornerIds = grid.cornerIds;
    this.cornerProduct = grid.cornerProduct;
    this.bitmap = bitmap;
    this.scan = scan;
    this.monsterCount = scan?.monsterCount;
    this.waterRoughness = scan?.waterRoughness;
  }

  cellCodeAt(r: number, c: number): JigsawCellCode {
    if (this.scan !== undefined && this.scan.isMonsterCell(r, c)) return 4;
    return this.bitmap.at(r, c) === 1 ? 2 : 1;
  }
}

function buildFinalMonsterFrames(grid: AssembledGrid, includeStitch: boolean, startStep: number, totalSteps: number): JigsawTraceFrame[] {
  const stitched = grid.stitchBorderless();
  const scan = scanSeaMonsters(stitched);
  if (!includeStitch) return [new StitchedTraceFrame(grid, scan.image, scan, startStep, totalSteps)];
  return [
    new StitchedTraceFrame(grid, stitched, undefined, startStep, totalSteps),
    new StitchedTraceFrame(grid, scan.image, scan, startStep + 1, totalSteps),
  ];
}

/** Builds a bounded trace of jigsaw assembly and (in monsters mode) sea-monster detection. */
export function traceJigsaw(puzzle: JigsawPuzzle, mode: JigsawMode, options: TraceOptions | undefined): readonly JigsawTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const grid = assembleGrid(puzzle);
  const totalTiles = grid.placements.length;

  if (limit === 1) {
    return mode === 'corners' ? [new TiledTraceFrame(grid, 'corners', 0, 1, totalTiles)] : buildFinalMonsterFrames(grid, false, 0, 1);
  }
  if (mode === 'monsters' && limit === 2) return buildFinalMonsterFrames(grid, true, 0, 2);

  const tailCount = mode === 'corners' ? 1 : 2;
  const indices = sampleTraceIndices(totalTiles, limit - tailCount);
  const totalSteps = indices.length + tailCount;
  const frames: JigsawTraceFrame[] = indices.map((idx, step) => new TiledTraceFrame(grid, 'assemble', step, totalSteps, idx + 1));
  if (mode === 'corners') frames.push(new TiledTraceFrame(grid, 'corners', indices.length, totalSteps, totalTiles));
  else frames.push(...buildFinalMonsterFrames(grid, true, indices.length, totalSteps));
  return frames;
}
