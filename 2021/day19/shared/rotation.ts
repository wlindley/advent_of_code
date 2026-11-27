import { Vec3, type AxisIndex } from './vec3';

/** Signed axis orientation multiplier. */
export type AxisSign = 1 | -1;

const AXIS_NAMES: readonly string[] = ['x', 'y', 'z'];
const AXES: readonly AxisIndex[] = [0, 1, 2];
const SIGNS: readonly AxisSign[] = [1, -1];

function formatTerm(axis: AxisIndex, sign: AxisSign): string {
  return `${sign === 1 ? '+' : '-'}${AXIS_NAMES[axis]!}`;
}

/** Right-handed 90-degree 3D rotation mapping input axes to signed output coordinates. */
export class Rotation3D {
  constructor(
    readonly index: number,
    readonly xAxis: AxisIndex,
    readonly xSign: AxisSign,
    readonly yAxis: AxisIndex,
    readonly ySign: AxisSign,
    readonly zAxis: AxisIndex,
    readonly zSign: AxisSign,
  ) {
    Object.freeze(this);
  }

  get label(): string {
    const tx = formatTerm(this.xAxis, this.xSign);
    const ty = formatTerm(this.yAxis, this.ySign);
    const tz = formatTerm(this.zAxis, this.zSign);
    return `(${tx}, ${ty}, ${tz})`;
  }

  apply(v: Vec3): Vec3 {
    return new Vec3(
      this.xSign * v.axis(this.xAxis),
      this.ySign * v.axis(this.yAxis),
      this.zSign * v.axis(this.zAxis),
    );
  }
}

function buildRotations24(): readonly Rotation3D[] {
  const list: Rotation3D[] = [];
  for (const xAxis of AXES) {
    for (const xSign of SIGNS) {
      for (const yAxis of AXES) {
        if (yAxis === xAxis) continue;
        const zAxis = (3 - xAxis - yAxis) as AxisIndex;
        const parity = (xAxis + 1) % 3 === yAxis ? 1 : -1;
        for (const ySign of SIGNS) {
          const zSign = (xSign * ySign * parity) as AxisSign;
          list.push(new Rotation3D(list.length, xAxis, xSign, yAxis, ySign, zAxis, zSign));
        }
      }
    }
  }
  return Object.freeze(list);
}

/** All 24 proper (det = +1) 90-degree 3D rotations; index 0 is identity. */
export const ROTATIONS_24: readonly Rotation3D[] = buildRotations24();

/** Identity rotation `(+x, +y, +z)`. */
export const IDENTITY_ROTATION: Rotation3D = ROTATIONS_24[0]!;
