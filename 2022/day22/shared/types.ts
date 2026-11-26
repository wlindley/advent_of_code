/** Grid cell state in a Monkey Map board. */
export const Tile = Object.freeze({
  Void: 0,
  Open: 1,
  Wall: 2,
} as const);

export type Tile = (typeof Tile)[keyof typeof Tile];

/** Heading index in AoC order: 0=Right, 1=Down, 2=Left, 3=Up. */
export type Facing = 0 | 1 | 2 | 3;

export type Turn = 'L' | 'R';

export type PathStep =
  | { readonly kind: 'move'; readonly distance: number }
  | { readonly kind: 'turn'; readonly turn: Turn };

export interface Pose {
  readonly row: number;
  readonly col: number;
  readonly facing: Facing;
}

/** Strategy interface decoupling movement/wrapping rules from the path walker. */
export interface Topology {
  readonly name: string;
  step(pose: Pose): Pose;
}

export const FACING_DELTAS: readonly [
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
] = Object.freeze([
  Object.freeze([0, 1] as const),
  Object.freeze([1, 0] as const),
  Object.freeze([0, -1] as const),
  Object.freeze([-1, 0] as const),
] as const);

export const FACING_SYMBOLS: readonly [string, string, string, string] = Object.freeze([
  '>',
  'v',
  '<',
  '^',
] as const);

/** Rotates a facing 90 degrees clockwise ('R') or counter-clockwise ('L'). */
export function turnFacing(facing: Facing, turn: Turn): Facing {
  return ((facing + (turn === 'R' ? 1 : 3)) % 4) as Facing;
}

/** Computes the AoC Day 22 password from a zero-based pose. */
export function computePassword(pose: Pose): number {
  return 1000 * (pose.row + 1) + 4 * (pose.col + 1) + pose.facing;
}
