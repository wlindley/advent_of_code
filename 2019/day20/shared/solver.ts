import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { reconstructCorridorPath } from './graph';
import { parseDonutMaze, type DonutMaze, type GridPoint } from './maze';
import type { DonutPolicy } from './policy';
import { solveDonutMaze, type DonutSolution } from './search';

export const DEFAULT_MAX_TRACE_STEPS = 240;

export interface DonutPathStep {
  readonly row: number;
  readonly col: number;
  readonly depth: number;
  readonly warpedVia: string | null;
}

export interface DonutTraceFrame {
  readonly maze: DonutMaze;
  readonly path: readonly DonutPathStep[];
  readonly stepIndex: number;
}

function appendCorridor(
  maze: DonutMaze,
  from: GridPoint,
  to: GridPoint,
  depth: number,
  steps: DonutPathStep[],
): void {
  const corridor = reconstructCorridorPath(maze, from, to);
  for (let i = 1; i < corridor.length; i += 1) {
    const pt = corridor[i]!;
    steps.push(Object.freeze({ row: pt.row, col: pt.col, depth, warpedVia: null }));
  }
}

function buildFullPath(maze: DonutMaze, solution: DonutSolution): readonly DonutPathStep[] {
  const start = maze.portals[maze.startId]!;
  const steps: DonutPathStep[] = [Object.freeze({ row: start.row, col: start.col, depth: 0, warpedVia: null })];
  let depth = 0;
  for (const hop of solution.hops) {
    const fromPortal = maze.portals[hop.fromPortalId]!;
    const toPortal = maze.portals[hop.toPortalId]!;
    if (hop.warpedVia === null) {
      appendCorridor(maze, fromPortal, toPortal, hop.depthAfter, steps);
    } else {
      const entryPortal = maze.portals[toPortal.pairId]!;
      appendCorridor(maze, fromPortal, entryPortal, depth, steps);
      steps.push(Object.freeze({ row: toPortal.row, col: toPortal.col, depth: hop.depthAfter, warpedVia: hop.warpedVia }));
      depth = hop.depthAfter;
    }
  }
  return Object.freeze(steps);
}

/** Shared PuzzleSolver for Day 20 Parts 1 and 2 parameterized by DonutPolicy. */
export class DonutSolver implements PuzzleSolver<DonutMaze, number, DonutTraceFrame> {
  readonly policy: DonutPolicy;

  constructor(policy: DonutPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): DonutMaze {
    return parseDonutMaze(raw);
  }

  solve(maze: DonutMaze): number {
    return solveDonutMaze(maze, this.policy).totalSteps;
  }

  trace(maze: DonutMaze, options?: TraceOptions): readonly DonutTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    const solution = solveDonutMaze(maze, this.policy);
    const path = buildFullPath(maze, solution);
    const indices = sampleTraceIndices(path.length, maxSteps);
    return Object.freeze(indices.map((stepIndex) => Object.freeze({ maze, path, stepIndex })));
  }
}
