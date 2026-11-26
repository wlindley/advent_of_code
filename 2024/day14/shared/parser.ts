import { Robot } from './model';

const ROBOT_LINE_RE = /^p=(\d+),(\d+)\s+v=(-?\d+),(-?\d+)$/;

/** Parses non-empty Restroom Redoubt robot specs (`p=x,y v=vx,vy`) into frozen `Robot` objects. */
export function parseRobots(raw: string): readonly Robot[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const robots: Robot[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    const match = ROBOT_LINE_RE.exec(trimmed);
    if (!match) {
      throw new Error(`Invalid robot specification on line ${i + 1}: "${trimmed}"`);
    }
    robots.push(
      new Robot(Number(match[1]!), Number(match[2]!), Number(match[3]!), Number(match[4]!)),
    );
  }
  if (robots.length === 0) {
    throw new Error('Input must contain at least one robot specification');
  }
  return Object.freeze(robots);
}
