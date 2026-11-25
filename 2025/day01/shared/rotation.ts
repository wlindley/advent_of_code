import { euclideanMod } from '../../../shared/core';

export const DIAL_SIZE = 100;
export const INITIAL_DIAL_POSITION = 50;

export type Direction = 'L' | 'R';

const TOKEN_PATTERN = /^([LR])(\d+)$/;

function assertValidPosition(position: number): void {
  if (!Number.isInteger(position) || position < 0 || position >= DIAL_SIZE) {
    throw new RangeError(`Dial position must be an integer in [0, ${DIAL_SIZE - 1}], got ${position}`);
  }
}

/** Immutable dial rotation instruction on a 0..99 circular safe dial. */
export class Rotation {
  readonly direction: Direction;
  readonly distance: number;

  constructor(direction: Direction, distance: number) {
    if (!Number.isSafeInteger(distance) || distance < 1) {
      throw new RangeError(`Rotation distance must be a positive safe integer, got ${distance}`);
    }
    this.direction = direction;
    this.distance = distance;
    Object.freeze(this);
  }

  get label(): string {
    return `${this.direction}${this.distance}`;
  }

  /** Returns the new dial position after applying this rotation from `position`. */
  applyTo(position: number): number {
    assertValidPosition(position);
    // Pre-reduce large click counts so position +/- step stays well within safe integers.
    const step = this.distance % DIAL_SIZE;
    return euclideanMod(position + (this.direction === 'R' ? step : -step), DIAL_SIZE);
  }

  /** Counts how many clicks during this rotation land on 0 (excluding starting position). */
  countZeroHitsFrom(position: number): number {
    assertValidPosition(position);
    const firstHit =
      this.direction === 'R'
        ? DIAL_SIZE - position
        : position === 0
          ? DIAL_SIZE
          : position;
    if (this.distance < firstHit) return 0;
    return 1 + Math.floor((this.distance - firstHit) / DIAL_SIZE);
  }

  static parse(token: string): Rotation {
    const match = TOKEN_PATTERN.exec(token);
    if (!match) {
      throw new Error(`Invalid rotation token "${token}"`);
    }
    return new Rotation(match[1] as Direction, Number(match[2]));
  }
}

export function parseRotations(raw: string): readonly Rotation[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Input must contain at least one rotation');
  }
  return trimmed.split(/\r?\n/).map((line, index) => {
    try {
      return Rotation.parse(line);
    } catch (error) {
      throw new Error(`Line ${index + 1}: ${(error as Error).message}`);
    }
  });
}
