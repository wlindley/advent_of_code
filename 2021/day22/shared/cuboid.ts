import type { ClosedInterval } from '../../../shared/core';

/** Immutable axis-aligned 3D integer cuboid defined as a product of closed `bigint` intervals. */
export class Cuboid {
  readonly x: ClosedInterval;
  readonly y: ClosedInterval;
  readonly z: ClosedInterval;

  constructor(x: ClosedInterval, y: ClosedInterval, z: ClosedInterval) {
    this.x = x;
    this.y = y;
    this.z = z;
    Object.freeze(this);
  }

  get volume(): bigint {
    return this.x.length * this.y.length * this.z.length;
  }

  overlaps(other: Cuboid): boolean {
    return this.x.overlaps(other.x) && this.y.overlaps(other.y) && this.z.overlaps(other.z);
  }

  intersection(other: Cuboid): Cuboid | null {
    if (!this.overlaps(other)) return null;
    return new Cuboid(
      this.x.intersection(other.x)!,
      this.y.intersection(other.y)!,
      this.z.intersection(other.z)!,
    );
  }

  /** Partitions `this \ cut` into up to 6 pairwise-disjoint axis-aligned slabs. */
  subtract(cut: Cuboid): readonly Cuboid[] {
    if (!this.overlaps(cut)) return Object.freeze([this]);
    const xOverlap = this.x.intersection(cut.x)!;
    const yOverlap = this.y.intersection(cut.y)!;
    const parts: Cuboid[] = [];
    for (const rx of this.x.subtract(cut.x)) parts.push(new Cuboid(rx, this.y, this.z));
    for (const ry of this.y.subtract(cut.y)) parts.push(new Cuboid(xOverlap, ry, this.z));
    for (const rz of this.z.subtract(cut.z)) parts.push(new Cuboid(xOverlap, yOverlap, rz));
    return Object.freeze(parts);
  }
}
