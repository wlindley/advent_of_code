import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import { parseLabMap, type CellCoord, type LabMap } from '../../shared';
import { ObstacleJumpTable } from './jumpTable';

export const DEFAULT_MAX_TRACE_STEPS = 200;

function freezeCoords(coords: readonly CellCoord[]): readonly CellCoord[] {
  const result: CellCoord[] = [];
  for (let i = 0; i < coords.length; i += 1) {
    const c = coords[i]!;
    result.push(Object.freeze({ row: c.row, col: c.col }));
  }
  return Object.freeze(result);
}

function validateFrameBounds(
  candidateIndex: number,
  totalCandidates: number,
  approachVertices: readonly CellCoord[],
  cycleVertices: readonly CellCoord[],
): void {
  if (!Number.isInteger(totalCandidates) || totalCandidates < 1) {
    throw new RangeError(`totalCandidates must be a positive integer, got ${totalCandidates}`);
  }
  if (!Number.isInteger(candidateIndex) || candidateIndex < 0 || candidateIndex >= totalCandidates) {
    throw new RangeError(
      `candidateIndex must be an integer in [0, ${totalCandidates - 1}], got ${candidateIndex}`,
    );
  }
  if (approachVertices.length < 1) {
    throw new RangeError('approachVertices must contain at least 1 coordinate');
  }
  if (cycleVertices.length < 2) {
    throw new RangeError('cycleVertices must contain at least 2 coordinates');
  }
  const first = cycleVertices[0]!;
  const last = cycleVertices[cycleVertices.length - 1]!;
  if (first.row !== last.row || first.col !== last.col) {
    throw new RangeError('cycleVertices must start and end at the same coordinate');
  }
}

/** Immutable trace frame representing one loop-inducing obstacle candidate and its trajectory. */
export class LoopCandidateFrame {
  readonly candidateIndex: number;
  readonly totalCandidates: number;
  readonly obstruction: CellCoord;
  readonly approachVertices: readonly CellCoord[];
  readonly cycleVertices: readonly CellCoord[];

  constructor(
    candidateIndex: number,
    totalCandidates: number,
    obstruction: CellCoord,
    approachVertices: readonly CellCoord[],
    cycleVertices: readonly CellCoord[],
  ) {
    validateFrameBounds(candidateIndex, totalCandidates, approachVertices, cycleVertices);
    this.candidateIndex = candidateIndex;
    this.totalCandidates = totalCandidates;
    this.obstruction = Object.freeze({ row: obstruction.row, col: obstruction.col });
    this.approachVertices = freezeCoords(approachVertices);
    this.cycleVertices = freezeCoords(cycleVertices);
    Object.freeze(this);
  }

  get cycleTurns(): number {
    return this.cycleVertices.length - 1;
  }

  get cycleSteps(): number {
    let moves = 0;
    for (let i = 1; i < this.cycleVertices.length; i += 1) {
      const prev = this.cycleVertices[i - 1]!;
      const curr = this.cycleVertices[i]!;
      moves += Math.abs(curr.row - prev.row) + Math.abs(curr.col - prev.col);
    }
    return moves + this.cycleTurns;
  }
}

export function findLoopObstructions(map: LabMap): readonly CellCoord[] {
  return new ObstacleJumpTable(map).findLoopObstructions();
}

export function countLoopObstructions(map: LabMap): number {
  return findLoopObstructions(map).length;
}

export function traceLoopObstructions(
  map: LabMap,
  options: TraceOptions = {},
): readonly LoopCandidateFrame[] {
  const maxSteps = validateMaxSteps(options.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const table = new ObstacleJumpTable(map);
  const obstructions = table.findLoopObstructions();
  const indices = sampleTraceIndices(obstructions.length, maxSteps);
  const frames: LoopCandidateFrame[] = [];
  for (const candidateIndex of indices) {
    const obstruction = obstructions[candidateIndex]!;
    const trajectory = table.traceLoopPath(obstruction)!;
    frames.push(
      new LoopCandidateFrame(
        candidateIndex,
        obstructions.length,
        obstruction,
        trajectory.approachVertices,
        trajectory.cycleVertices,
      ),
    );
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<LabMap, number, LoopCandidateFrame> = Object.freeze({
  parse: parseLabMap,
  solve: countLoopObstructions,
  trace: traceLoopObstructions,
});
