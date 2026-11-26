import { type DigDirection, type DigStep, DIRECTION_DELTAS } from './digPlan';

export interface LagoonPoint {
  readonly x: bigint;
  readonly y: bigint;
}

export type PolygonOrientation = 'cw' | 'ccw';

/** Axis-aligned bounding box of polygon centerline vertices in exact `bigint` coordinates. */
export class LagoonBounds {
  readonly minX: bigint;
  readonly maxX: bigint;
  readonly minY: bigint;
  readonly maxY: bigint;

  constructor(minX: bigint, maxX: bigint, minY: bigint, maxY: bigint) {
    if (minX > maxX || minY > maxY) {
      throw new RangeError(`Invalid bounds: X=[${minX},${maxX}] Y=[${minY},${maxY}]`);
    }
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
    Object.freeze(this);
  }

  get spanX(): bigint { return this.maxX - this.minX; }
  get spanY(): bigint { return this.maxY - this.minY; }
}

/** Directed orthogonal trench segment starting at `start` with dynamic endpoint & Shoelace term. */
export class LagoonEdge {
  readonly start: LagoonPoint;
  readonly direction: DigDirection;
  readonly distance: bigint;
  readonly color: string;

  constructor(start: LagoonPoint, direction: DigDirection, distance: bigint, color: string) {
    if (distance <= 0n) throw new RangeError(`Edge distance must be positive, got ${distance}`);
    this.start = Object.freeze({ x: start.x, y: start.y });
    this.direction = direction;
    this.distance = distance;
    this.color = color;
    Object.freeze(this);
  }

  get end(): LagoonPoint {
    const { dx, dy } = DIRECTION_DELTAS[this.direction];
    return Object.freeze({ x: this.start.x + dx * this.distance, y: this.start.y + dy * this.distance });
  }

  get shoelaceTerm(): bigint {
    const endpoint = this.end;
    return this.start.x * endpoint.y - endpoint.x * this.start.y;
  }
}

/** Closed, non-degenerate orthogonal trench polygon with exact BigInt Shoelace & Pick's getters. */
export class LagoonPolygon {
  readonly edges: readonly LagoonEdge[];

  private constructor(edges: readonly LagoonEdge[]) {
    this.edges = Object.freeze([...edges]);
    Object.freeze(this);
  }

  static fromSteps(steps: readonly DigStep[]): LagoonPolygon {
    if (steps.length === 0) throw new Error('Dig steps must not be empty');
    const edges: LagoonEdge[] = [];
    let cursor: LagoonPoint = { x: 0n, y: 0n };
    for (const step of steps) {
      const edge = new LagoonEdge(cursor, step.direction, step.distance, step.color);
      edges.push(edge);
      cursor = edge.end;
    }
    if (cursor.x !== 0n || cursor.y !== 0n) {
      throw new Error(`Dig steps are not closed: ended at (${cursor.x}, ${cursor.y})`);
    }
    const polygon = new LagoonPolygon(edges);
    if (polygon.signedDoubleArea === 0n) throw new Error('Dig steps enclose zero area');
    return polygon;
  }

  get stepCount(): number { return this.edges.length; }

  get bounds(): LagoonBounds {
    let minX = this.edges[0]!.start.x;
    let maxX = minX;
    let minY = this.edges[0]!.start.y;
    let maxY = minY;
    for (const { start } of this.edges) {
      if (start.x < minX) minX = start.x;
      if (start.x > maxX) maxX = start.x;
      if (start.y < minY) minY = start.y;
      if (start.y > maxY) maxY = start.y;
    }
    return new LagoonBounds(minX, maxX, minY, maxY);
  }

  get boundaryCount(): bigint {
    let total = 0n;
    for (const edge of this.edges) total += edge.distance;
    return total;
  }

  get signedDoubleArea(): bigint {
    let sum = 0n;
    for (const edge of this.edges) sum += edge.shoelaceTerm;
    return sum;
  }

  get absDoubleArea(): bigint {
    const signed = this.signedDoubleArea;
    return signed < 0n ? -signed : signed;
  }

  get orientation(): PolygonOrientation { return this.signedDoubleArea > 0n ? 'cw' : 'ccw'; }
  get interiorCount(): bigint { return (this.absDoubleArea - this.boundaryCount + 2n) / 2n; }
  get totalVolume(): bigint { return this.interiorCount + this.boundaryCount; }
}
