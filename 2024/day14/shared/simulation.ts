import {
  type QuadrantCounts,
  type Robot,
  type TorusSpace,
  assertNonNegativeSafeInt,
} from './model';

function assertOccupancyLength(occupancy: Uint32Array, space: TorusSpace): void {
  if (occupancy.length !== space.area) {
    throw new RangeError(
      `occupancy buffer length ${occupancy.length} does not match space area ${space.area}`,
    );
  }
}

/** Counts robots strictly inside each of the four midline-separated quadrants at `seconds`. */
export function countQuadrants(
  robots: readonly Robot[],
  space: TorusSpace,
  seconds: number,
): QuadrantCounts {
  assertNonNegativeSafeInt(seconds, 'seconds');
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  for (const robot of robots) {
    const pos = robot.positionAt(space, seconds);
    const q = space.quadrantOf(pos.x, pos.y);
    if (q !== null) {
      counts[q] += 1;
    }
  }
  return Object.freeze([counts[0], counts[1], counts[2], counts[3]] as const);
}

/** Multiplies the four quadrant counts into the Restroom Redoubt safety factor. */
export function safetyFactorOf(quadrants: QuadrantCounts): number {
  return quadrants[0] * quadrants[1] * quadrants[2] * quadrants[3];
}

/** Evaluates the safety factor for `robots` in `space` after `seconds`. */
export function evaluateSafetyFactor(
  robots: readonly Robot[],
  space: TorusSpace,
  seconds: number,
): number {
  return safetyFactorOf(countQuadrants(robots, space, seconds));
}

/** Clears `out` and accumulates robot counts per cell at `seconds`. */
export function fillOccupancy(
  robots: readonly Robot[],
  space: TorusSpace,
  seconds: number,
  out: Uint32Array = new Uint32Array(space.area),
): Uint32Array {
  assertNonNegativeSafeInt(seconds, 'seconds');
  assertOccupancyLength(out, space);
  out.fill(0);
  for (const robot of robots) {
    const pos = robot.positionAt(space, seconds);
    const idx = space.cellIndex(pos.x, pos.y);
    out[idx] = out[idx]! + 1;
  }
  return out;
}

/** Derives quadrant counts from an occupancy grid buffer. */
export function countOccupancyQuadrants(
  occupancy: Uint32Array,
  space: TorusSpace,
): QuadrantCounts {
  assertOccupancyLength(occupancy, space);
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  for (let y = 0; y < space.height; y += 1) {
    for (let x = 0; x < space.width; x += 1) {
      const count = occupancy[y * space.width + x]!;
      if (count === 0) continue;
      const q = space.quadrantOf(x, y);
      if (q !== null) {
        counts[q] += count;
      }
    }
  }
  return Object.freeze([counts[0], counts[1], counts[2], counts[3]] as const);
}

/** Counts orthogonal non-wrapping occupied neighbor pairs `(x+1, y)` and `(x, y+1)`. */
export function countAdjacentOccupied(occupancy: Uint32Array, space: TorusSpace): number {
  assertOccupancyLength(occupancy, space);
  let pairs = 0;
  for (let y = 0; y < space.height; y += 1) {
    for (let x = 0; x < space.width; x += 1) {
      const idx = y * space.width + x;
      if (occupancy[idx]! === 0) continue;
      if (x + 1 < space.width && occupancy[idx + 1]! > 0) pairs += 1;
      if (y + 1 < space.height && occupancy[idx + space.width]! > 0) pairs += 1;
    }
  }
  return pairs;
}
