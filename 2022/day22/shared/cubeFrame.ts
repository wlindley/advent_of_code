import type { Facing } from './types';

export type Vec3 = readonly [number, number, number];

export interface FaceFrame {
  readonly blockRow: number;
  readonly blockCol: number;
  readonly r: Vec3;
  readonly d: Vec3;
  readonly n: Vec3;
}

export interface SeamLocalPose {
  readonly localRow: number;
  readonly localCol: number;
  readonly facing: Facing;
}

/** Negates a Vec3 using `0 - x` so zero components never become `-0`. */
export function negateVec3(v: Vec3): Vec3 {
  return Object.freeze([0 - v[0], 0 - v[1], 0 - v[2]] as const);
}

/** Computes the 3D dot product of two vectors. */
export function dotVec3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Computes `a + b * s` in 3D space. */
export function addScaledVec3(a: Vec3, b: Vec3, s: number): Vec3 {
  return Object.freeze([a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s] as const);
}

/** Formats a unit integer Vec3 as a stable lookup key. */
export function vec3Key(v: Vec3): string {
  return `${v[0]},${v[1]},${v[2]}`;
}

/** Folds an adjacent face frame orthogonally along `facing` preserving `r x d = n`. */
export function foldFrame(
  frame: FaceFrame,
  facing: Facing,
  nextBlockRow: number,
  nextBlockCol: number,
): FaceFrame {
  if (facing === 0) {
    return Object.freeze({
      blockRow: nextBlockRow,
      blockCol: nextBlockCol,
      n: frame.r,
      r: negateVec3(frame.n),
      d: frame.d,
    });
  }
  if (facing === 1) {
    return Object.freeze({
      blockRow: nextBlockRow,
      blockCol: nextBlockCol,
      n: frame.d,
      r: frame.r,
      d: negateVec3(frame.n),
    });
  }
  if (facing === 2) {
    return Object.freeze({
      blockRow: nextBlockRow,
      blockCol: nextBlockCol,
      n: negateVec3(frame.r),
      r: frame.n,
      d: frame.d,
    });
  }
  return Object.freeze({
    blockRow: nextBlockRow,
    blockCol: nextBlockCol,
    n: negateVec3(frame.d),
    r: frame.r,
    d: frame.n,
  });
}

/** Maps a 2D face-local facing to its 3D tangent unit vector. */
export function facingToVec3(frame: FaceFrame, facing: Facing): Vec3 {
  const dirs: readonly [Vec3, Vec3, Vec3, Vec3] = [
    frame.r,
    frame.d,
    negateVec3(frame.r),
    negateVec3(frame.d),
  ];
  return dirs[facing];
}

/** Maps a 3D tangent unit vector on `frame` back to a 2D facing index. */
export function vec3ToFacing(frame: FaceFrame, dir: Vec3): Facing {
  if (dotVec3(dir, frame.r) === 1) return 0;
  if (dotVec3(dir, frame.d) === 1) return 1;
  if (dotVec3(dir, frame.r) === -1) return 2;
  return 3;
}

/** Maps a local border cell and exit heading across a 3D cube seam onto face `to`. */
export function mapSeamPosition(
  from: FaceFrame,
  to: FaceFrame,
  localRow: number,
  localCol: number,
  faceSize: number,
): SeamLocalPose {
  const half = faceSize - 1;
  const uA = 2 * localCol - half;
  const vA = 2 * localRow - half;
  const onA = addScaledVec3(addScaledVec3([0, 0, 0], from.r, uA), from.d, vA);
  const pB = addScaledVec3(addScaledVec3(onA, to.n, -half), from.n, half);
  return Object.freeze({
    localRow: (dotVec3(pB, to.d) + half) / 2,
    localCol: (dotVec3(pB, to.r) + half) / 2,
    facing: vec3ToFacing(to, negateVec3(from.n)),
  });
}
