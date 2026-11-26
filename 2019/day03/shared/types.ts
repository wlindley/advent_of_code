import { ClosedInterval } from '../../../shared/core';

export type Direction = 'U' | 'D' | 'L' | 'R';

export type Orientation = 'H' | 'V';

export interface GridPoint {
  readonly x: bigint;
  readonly y: bigint;
}

export interface WireMove {
  readonly direction: Direction;
  readonly distance: bigint;
}

export interface WireBounds {
  readonly minX: bigint;
  readonly maxX: bigint;
  readonly minY: bigint;
  readonly maxY: bigint;
}

export interface Viewport {
  readonly width: number;
  readonly height: number;
  readonly padding: number;
}

export interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
}

export function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

export function minBigInt(a: bigint, b: bigint): bigint {
  return a <= b ? a : b;
}

export function maxBigInt(a: bigint, b: bigint): bigint {
  return a >= b ? a : b;
}

/** Immutable directed Manhattan wire segment with dynamically computed geometry. */
export class WireSegment {
  readonly index: number;
  readonly start: GridPoint;
  readonly direction: Direction;
  readonly length: bigint;
  readonly startSteps: bigint;

  constructor(
    index: number,
    start: GridPoint,
    direction: Direction,
    length: bigint,
    startSteps: bigint,
  ) {
    if (!Number.isInteger(index) || index < 0) {
      throw new RangeError(`Segment index must be a non-negative integer, got ${index}`);
    }
    if (length < 1n) {
      throw new RangeError(`Segment length must be >= 1, got ${length}`);
    }
    if (startSteps < 0n) {
      throw new RangeError(`Segment startSteps must be >= 0, got ${startSteps}`);
    }
    this.index = index;
    this.start = Object.freeze({ x: start.x, y: start.y });
    this.direction = direction;
    this.length = length;
    this.startSteps = startSteps;
    Object.freeze(this);
  }

  get orientation(): Orientation {
    return this.direction === 'L' || this.direction === 'R' ? 'H' : 'V';
  }

  get end(): GridPoint {
    if (this.direction === 'R') return { x: this.start.x + this.length, y: this.start.y };
    if (this.direction === 'L') return { x: this.start.x - this.length, y: this.start.y };
    if (this.direction === 'U') return { x: this.start.x, y: this.start.y + this.length };
    return { x: this.start.x, y: this.start.y - this.length };
  }

  get endSteps(): bigint {
    return this.startSteps + this.length;
  }

  get fixedCoord(): bigint {
    return this.orientation === 'H' ? this.start.y : this.start.x;
  }

  get span(): ClosedInterval {
    const end = this.end;
    if (this.orientation === 'H') {
      return new ClosedInterval(minBigInt(this.start.x, end.x), maxBigInt(this.start.x, end.x));
    }
    return new ClosedInterval(minBigInt(this.start.y, end.y), maxBigInt(this.start.y, end.y));
  }

  stepsTo(point: GridPoint): bigint {
    return this.startSteps + absBigInt(point.x - this.start.x) + absBigInt(point.y - this.start.y);
  }
}

export interface WirePair {
  readonly first: readonly WireSegment[];
  readonly second: readonly WireSegment[];
}

/** Immutable intersection record between two wires with dynamic distance/delay metrics. */
export class WireCrossing {
  readonly point: GridPoint;
  readonly firstSteps: bigint;
  readonly secondSteps: bigint;
  readonly discoveryStep: number;

  constructor(
    point: GridPoint,
    firstSteps: bigint,
    secondSteps: bigint,
    discoveryStep: number,
  ) {
    if (firstSteps < 1n) {
      throw new RangeError(`firstSteps must be >= 1, got ${firstSteps}`);
    }
    if (secondSteps < 1n) {
      throw new RangeError(`secondSteps must be >= 1, got ${secondSteps}`);
    }
    if (!Number.isInteger(discoveryStep) || discoveryStep < 0) {
      throw new RangeError(`discoveryStep must be a non-negative integer, got ${discoveryStep}`);
    }
    this.point = Object.freeze({ x: point.x, y: point.y });
    this.firstSteps = firstSteps;
    this.secondSteps = secondSteps;
    this.discoveryStep = discoveryStep;
    Object.freeze(this);
  }

  get manhattanDistance(): bigint {
    return absBigInt(this.point.x) + absBigInt(this.point.y);
  }

  get signalDelay(): bigint {
    return this.firstSteps + this.secondSteps;
  }
}
