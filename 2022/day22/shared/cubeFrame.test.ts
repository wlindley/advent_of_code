import { describe, expect, it } from 'vitest';
import {
  addScaledVec3,
  dotVec3,
  facingToVec3,
  foldFrame,
  mapSeamPosition,
  negateVec3,
  vec3Key,
  vec3ToFacing,
  type FaceFrame,
} from './cubeFrame';

const TOP_FRAME: FaceFrame = {
  blockRow: 0,
  blockCol: 2,
  r: [1, 0, 0],
  d: [0, 1, 0],
  n: [0, 0, 1],
};

describe('cubeFrame', () => {
  it('performs Vec3 negation without -0, dot product, scaled addition, and key formatting', () => {
    const neg = negateVec3([1, 0, -1]);
    expect(neg).toEqual([-1, 0, 1]);
    expect(Object.is(neg[1], -0)).toBe(false);
    expect(dotVec3([1, 2, 3], [4, -5, 6])).toBe(12);
    expect(addScaledVec3([1, 2, 3], [2, -1, 0], 3)).toEqual([7, -1, 3]);
    expect(vec3Key([-1, 0, 1])).toBe('-1,0,1');
  });

  it('folds FaceFrame orthogonally in all four directions', () => {
    const right = foldFrame(TOP_FRAME, 0, 0, 3);
    expect(right).toEqual({ blockRow: 0, blockCol: 3, n: [1, 0, 0], r: [0, 0, -1], d: [0, 1, 0] });

    const down = foldFrame(TOP_FRAME, 1, 1, 2);
    expect(down).toEqual({ blockRow: 1, blockCol: 2, n: [0, 1, 0], r: [1, 0, 0], d: [0, 0, -1] });

    const left = foldFrame(TOP_FRAME, 2, 0, 1);
    expect(left).toEqual({ blockRow: 0, blockCol: 1, n: [-1, 0, 0], r: [0, 0, 1], d: [0, 1, 0] });

    const up = foldFrame(TOP_FRAME, 3, -1, 2);
    expect(up).toEqual({ blockRow: -1, blockCol: 2, n: [0, -1, 0], r: [1, 0, 0], d: [0, 0, 1] });
  });

  it('converts between facing and 3D tangent vector for all 4 directions', () => {
    for (const facing of [0, 1, 2, 3] as const) {
      const vec = facingToVec3(TOP_FRAME, facing);
      expect(vec3ToFacing(TOP_FRAME, vec)).toBe(facing);
    }
  });

  it('maps seam positions accurately across folded cube edges', () => {
    const face12 = foldFrame(TOP_FRAME, 1, 1, 2);
    const face22 = foldFrame(face12, 1, 2, 2);
    const face23 = foldFrame(face22, 0, 2, 3);

    // Example seam: (row 5, col 11, >) on face (1,2) -> (row 8, col 14, v) on face (2,3) at S=4
    const mapped = mapSeamPosition(face12, face23, 1, 3, 4);
    expect(mapped).toEqual({ localRow: 0, localCol: 2, facing: 1 });
  });
});
