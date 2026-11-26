import { assertSafeInt, type VoxelCoord, VoxelDroplet } from './droplet';

const COORD_LINE_RE = /^(-?\d+),(-?\d+),(-?\d+)$/;

function parseSafeInt(token: string, lineNumber: number, axis: string): number {
  return assertSafeInt(Number(token), `${axis} at line ${lineNumber}`);
}

/** Parses newline-delimited `x,y,z` voxel coordinates, skipping blank lines. */
export function parseVoxelCoords(raw: string): readonly VoxelCoord[] {
  const lines = raw.split(/\r?\n/);
  const coords: VoxelCoord[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    const lineNumber = i + 1;
    const match = COORD_LINE_RE.exec(trimmed);
    if (!match) {
      throw new SyntaxError(`Invalid voxel coordinate at line ${lineNumber}: "${trimmed}"`);
    }
    coords.push({
      x: parseSafeInt(match[1]!, lineNumber, 'x'),
      y: parseSafeInt(match[2]!, lineNumber, 'y'),
      z: parseSafeInt(match[3]!, lineNumber, 'z'),
    });
  }
  if (coords.length === 0) {
    throw new RangeError('Input contains no voxel coordinates');
  }
  return Object.freeze(coords);
}

/** Parses raw puzzle text into an immutable padded `VoxelDroplet`. */
export function parseDroplet(raw: string): VoxelDroplet {
  return VoxelDroplet.fromCoords(parseVoxelCoords(raw));
}
