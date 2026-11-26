export interface Point3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface JunctionPair {
  readonly u: number;
  readonly v: number;
  readonly distSq: number;
}

const INT_PATTERN = /^-?\d+$/;

function parseCoordinate(token: string, lineNumber: number, axis: string): number {
  if (!INT_PATTERN.test(token)) {
    throw new Error(`Invalid ${axis} coordinate "${token}" on line ${lineNumber}`);
  }
  const value = Number(token);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Coordinate ${axis}="${token}" on line ${lineNumber} is not a safe integer`);
  }
  return value === 0 ? 0 : value;
}

export function parseJunctions(raw: string): readonly Point3D[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Junction box input must not be empty');
  }

  const lines = trimmed.split(/\r?\n/);
  const points: Point3D[] = lines.map((line, index) => {
    const tokens = line.split(',');
    if (tokens.length !== 3) {
      throw new Error(`Expected 3 comma-separated coordinates on line ${index + 1}, got ${tokens.length}`);
    }
    return Object.freeze({
      x: parseCoordinate(tokens[0]!, index + 1, 'x'),
      y: parseCoordinate(tokens[1]!, index + 1, 'y'),
      z: parseCoordinate(tokens[2]!, index + 1, 'z'),
    });
  });

  return Object.freeze(points);
}

export function squaredDistance3D(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  const distSq = dx * dx + dy * dy + dz * dz;
  if (!Number.isSafeInteger(distSq)) {
    throw new RangeError(`Squared distance exceeds Number.MAX_SAFE_INTEGER: ${distSq}`);
  }
  return distSq;
}

export function compareJunctionPairs(a: JunctionPair, b: JunctionPair): number {
  return a.distSq - b.distSq || a.u - b.u || a.v - b.v;
}
