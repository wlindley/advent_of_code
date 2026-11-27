/** Canonical 3D axis index (`0 = x`, `1 = y`, `2 = z`). */
export type AxisIndex = 0 | 1 | 2;

function validateSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
  return 0 + value;
}

/** Immutable 3D integer coordinate vector with exact equality and metric helpers. */
export class Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;

  constructor(x: number, y: number, z: number) {
    this.x = validateSafeInteger(x, 'x');
    this.y = validateSafeInteger(y, 'y');
    this.z = validateSafeInteger(z, 'z');
    Object.freeze(this);
  }

  get key(): string {
    return `${this.x},${this.y},${this.z}`;
  }

  add(other: Vec3): Vec3 {
    return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  subtract(other: Vec3): Vec3 {
    return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  manhattanDistanceTo(other: Vec3): number {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y) + Math.abs(this.z - other.z);
  }

  squaredDistanceTo(other: Vec3): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    return dx * dx + dy * dy + dz * dz;
  }

  axis(index: AxisIndex): number {
    if (index === 0) return this.x;
    if (index === 1) return this.y;
    return this.z;
  }

  equals(other: Vec3): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  format(): string {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }
}
