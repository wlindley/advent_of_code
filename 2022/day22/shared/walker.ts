import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { MonkeyBoard } from './board';
import type { MonkeyMapInput } from './parser';
import { Tile, turnFacing, type Facing, type PathStep, type Pose, type Topology } from './types';

export const DEFAULT_TRACE_MAX_STEPS = 240;

export interface TrailSegment {
  readonly fromRow: number;
  readonly fromCol: number;
  readonly toRow: number;
  readonly toCol: number;
  readonly facing: Facing;
  readonly isWrap: boolean;
}

export interface WrapJump {
  readonly from: Pose;
  readonly to: Pose;
}

export interface MonkeyMapTraceFrame {
  readonly instructionIndex: number;
  readonly totalInstructions: number;
  readonly pose: Pose;
  readonly stepText: string;
  readonly trail: readonly TrailSegment[];
  readonly trailCount: number;
  readonly lastWrap: WrapJump | null;
  readonly blockedByWall: boolean;
}

interface MoveResult {
  readonly pose: Pose;
  readonly lastWrap: WrapJump | null;
  readonly blockedByWall: boolean;
}

interface TraceSnapshot {
  readonly instructionIndex: number;
  readonly pose: Pose;
  readonly stepText: string;
  readonly trailCount: number;
  readonly lastWrap: WrapJump | null;
  readonly blockedByWall: boolean;
}

function appendTrailSegment(trail: TrailSegment[], from: Pose, to: Pose, isWrap: boolean): void {
  const prev = trail[trail.length - 1];
  if (!isWrap && prev && !prev.isWrap && prev.facing === to.facing) {
    trail[trail.length - 1] = Object.freeze({
      fromRow: prev.fromRow, fromCol: prev.fromCol,
      toRow: to.row, toCol: to.col, facing: prev.facing, isWrap: false,
    });
    return;
  }
  trail.push(Object.freeze({
    fromRow: from.row, fromCol: from.col,
    toRow: to.row, toCol: to.col, facing: to.facing, isWrap,
  }));
}

function stepMove(
  board: MonkeyBoard,
  topology: Topology,
  startPose: Pose,
  distance: number,
  trail: TrailSegment[] | null,
): MoveResult {
  let pose = startPose;
  let lastWrap: WrapJump | null = null;
  let blockedByWall = false;
  for (let i = 0; i < distance; i += 1) {
    const next = topology.step(pose);
    // Check wall BEFORE committing pose so seam-blocked steps keep pre-wrap facing.
    if (board.tileAt(next.row, next.col) === Tile.Wall) {
      blockedByWall = true;
      break;
    }
    if (trail !== null) {
      const dist = Math.abs(next.row - pose.row) + Math.abs(next.col - pose.col);
      const isWrap = dist !== 1 || next.facing !== pose.facing;
      if (isWrap) lastWrap = Object.freeze({ from: pose, to: next });
      appendTrailSegment(trail, pose, next, isWrap);
    }
    pose = next;
  }
  return { pose, lastWrap, blockedByWall };
}

function formatMoveText(distance: number, result: MoveResult): string {
  if (result.blockedByWall) return `Move ${distance} (wall)`;
  if (result.lastWrap !== null) return `Move ${distance} (wrap)`;
  return `Move ${distance}`;
}

function nextSnapshot(
  board: MonkeyBoard,
  topology: Topology,
  pose: Pose,
  step: PathStep,
  instructionIndex: number,
  trail: TrailSegment[],
): TraceSnapshot {
  if (step.kind === 'turn') {
    const turned = { row: pose.row, col: pose.col, facing: turnFacing(pose.facing, step.turn) };
    return {
      instructionIndex, pose: turned, stepText: `Turn ${step.turn}`,
      trailCount: trail.length, lastWrap: null, blockedByWall: false,
    };
  }
  const res = stepMove(board, topology, pose, step.distance, trail);
  return {
    instructionIndex, pose: res.pose, stepText: formatMoveText(step.distance, res),
    trailCount: trail.length, lastWrap: res.lastWrap, blockedByWall: res.blockedByWall,
  };
}

/** Walks the complete monkey path under `topology` and returns the final pose. */
export function walkMonkeyMap(input: MonkeyMapInput, topology: Topology): Pose {
  let pose = input.board.findStartPose();
  for (const step of input.path) {
    if (step.kind === 'turn') {
      pose = { row: pose.row, col: pose.col, facing: turnFacing(pose.facing, step.turn) };
    } else {
      pose = stepMove(input.board, topology, pose, step.distance, null).pose;
    }
  }
  return pose;
}

/** Produces a bounded trace sharing one frozen trail array across sampled frames. */
export function traceMonkeyMap(
  input: MonkeyMapInput,
  topology: Topology,
  options?: TraceOptions,
): readonly MonkeyMapTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const trail: TrailSegment[] = [];
  const startPose = input.board.findStartPose();
  const snapshots: TraceSnapshot[] = [{
    instructionIndex: 0, pose: startPose, stepText: 'Start',
    trailCount: 0, lastWrap: null, blockedByWall: false,
  }];
  for (let i = 0; i < input.path.length; i += 1) {
    const prev = snapshots[snapshots.length - 1]!;
    snapshots.push(nextSnapshot(input.board, topology, prev.pose, input.path[i]!, i + 1, trail));
  }
  const frozenTrail = Object.freeze(trail);
  const frames: MonkeyMapTraceFrame[] = [];
  for (const idx of sampleTraceIndices(snapshots.length, maxSteps)) {
    frames.push(Object.freeze({
      ...snapshots[idx]!, totalInstructions: input.path.length, trail: frozenTrail,
    }));
  }
  return Object.freeze(frames);
}
