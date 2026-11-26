export type SegmentOrientation = 'point' | 'horizontal' | 'vertical' | 'diagonal' | 'oblique';

export interface VentSelectionPolicy {
  readonly id: 'axis-aligned' | 'octilinear';
  readonly label: string;
  readonly description: string;
  includes(segment: VentSegment): boolean;
}

function assertSafeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${label} must be a safe integer, got ${value}`);
  return value + 0;
}

/** Immutable 2D integer lattice point. */
export class VentPoint {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = assertSafeInt(x, 'point.x');
    this.y = assertSafeInt(y, 'point.y');
    Object.freeze(this);
  }

  equals(other: VentPoint): boolean { return this.x === other.x && this.y === other.y; }
}

/** Immutable directed line segment between two safe-integer endpoints. */
export class VentSegment {
  readonly start: VentPoint;
  readonly end: VentPoint;

  constructor(start: VentPoint, end: VentPoint) {
    assertSafeInt(end.x - start.x, 'segment.dx');
    assertSafeInt(end.y - start.y, 'segment.dy');
    this.start = start;
    this.end = end;
    Object.freeze(this);
  }

  get dx(): number { return this.end.x - this.start.x; }
  get dy(): number { return this.end.y - this.start.y; }
  get minX(): number { return Math.min(this.start.x, this.end.x); }
  get maxX(): number { return Math.max(this.start.x, this.end.x); }
  get minY(): number { return Math.min(this.start.y, this.end.y); }
  get maxY(): number { return Math.max(this.start.y, this.end.y); }

  get orientation(): SegmentOrientation {
    const { dx, dy } = this;
    if (dx === 0 && dy === 0) return 'point';
    if (dy === 0) return 'horizontal';
    if (dx === 0) return 'vertical';
    return Math.abs(dx) === Math.abs(dy) ? 'diagonal' : 'oblique';
  }

  get isAxisAligned(): boolean { return this.dx === 0 || this.dy === 0; }
  get isOctilinear(): boolean { return this.isAxisAligned || Math.abs(this.dx) === Math.abs(this.dy); }
  get stepX(): number { return Math.sign(this.dx) + 0; }
  get stepY(): number { return Math.sign(this.dy) + 0; }

  get pointCount(): number {
    this.requireOctilinear();
    return Math.max(Math.abs(this.dx), Math.abs(this.dy)) + 1;
  }

  private requireOctilinear(): void {
    if (!this.isOctilinear) throw new RangeError(`Non-octilinear segment delta (${this.dx}, ${this.dy})`);
  }

  forEachPoint(visitor: (x: number, y: number) => void): void {
    this.requireOctilinear();
    const count = this.pointCount;
    const sx = this.stepX;
    const sy = this.stepY;
    for (let i = 0; i < count; i += 1) visitor(this.start.x + i * sx, this.start.y + i * sy);
  }
}

/** Immutable axis-aligned integer bounding box with BigInt area metrics. */
export class VentBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;

  constructor(minX: number, maxX: number, minY: number, maxY: number) {
    this.minX = assertSafeInt(minX, 'bounds.minX');
    this.maxX = assertSafeInt(maxX, 'bounds.maxX');
    this.minY = assertSafeInt(minY, 'bounds.minY');
    this.maxY = assertSafeInt(maxY, 'bounds.maxY');
    if (this.minX > this.maxX) throw new RangeError(`bounds.minX (${this.minX}) > maxX (${this.maxX})`);
    if (this.minY > this.maxY) throw new RangeError(`bounds.minY (${this.minY}) > maxY (${this.maxY})`);
    Object.freeze(this);
  }

  get width(): bigint { return BigInt(this.maxX) - BigInt(this.minX) + 1n; }
  get height(): bigint { return BigInt(this.maxY) - BigInt(this.minY) + 1n; }
  get area(): bigint { return this.width * this.height; }

  contains(point: VentPoint): boolean {
    return point.x >= this.minX && point.x <= this.maxX && point.y >= this.minY && point.y <= this.maxY;
  }
}

/** Computes tight bounding box enclosing a non-empty list of segments. */
export function computeSegmentBounds(segments: readonly VentSegment[]): VentBounds {
  if (segments.length === 0) throw new RangeError('Cannot compute bounds for empty segment list');
  let minX = segments[0]!.minX;
  let maxX = segments[0]!.maxX;
  let minY = segments[0]!.minY;
  let maxY = segments[0]!.maxY;
  for (let i = 1; i < segments.length; i += 1) {
    const s = segments[i]!;
    if (s.minX < minX) minX = s.minX;
    if (s.maxX > maxX) maxX = s.maxX;
    if (s.minY < minY) minY = s.minY;
    if (s.maxY > maxY) maxY = s.maxY;
  }
  return new VentBounds(minX, maxX, minY, maxY);
}

/** Immutable non-empty collection of hydrothermal vent segments. */
export class VentField {
  readonly segments: readonly VentSegment[];

  constructor(segments: readonly VentSegment[]) {
    if (segments.length === 0) throw new RangeError('VentField requires at least one segment');
    this.segments = Object.freeze([...segments]);
    Object.freeze(this);
  }

  get segmentCount(): number { return this.segments.length; }
  get bounds(): VentBounds { return computeSegmentBounds(this.segments); }
  filter(policy: VentSelectionPolicy): readonly VentSegment[] {
    return Object.freeze(this.segments.filter((segment) => policy.includes(segment)));
  }
}
