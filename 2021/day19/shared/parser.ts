import { ScannerReport } from './scanner';
import { Vec3 } from './vec3';

const HEADER_RE = /^--- scanner (\d+) ---$/;
const COORD_RE = /^(-?\d+),(-?\d+),(-?\d+)$/;

function parseBeaconCoord(line: string, lineNumber: number): Vec3 {
  const match = COORD_RE.exec(line);
  if (match === null) {
    throw new SyntaxError(`Malformed beacon coordinate on line ${lineNumber}: "${line}"`);
  }
  return new Vec3(Number(match[1]!), Number(match[2]!), Number(match[3]!));
}

function finalizeSection(id: number, beacons: readonly Vec3[]): ScannerReport {
  if (beacons.length === 0) {
    throw new SyntaxError(`Scanner ${id} has no beacon coordinates`);
  }
  return new ScannerReport(id, beacons);
}

function claimScannerId(rawId: string, seenIds: Set<number>): number {
  const nextId = Number(rawId);
  if (seenIds.has(nextId)) {
    throw new SyntaxError(`Duplicate scanner id: ${nextId}`);
  }
  seenIds.add(nextId);
  return nextId;
}

/** Parses strict Advent of Code Day 19 scanner reports into frozen `ScannerReport` instances. */
export function parseScannerReports(raw: string): readonly ScannerReport[] {
  const lines = raw.split(/\r?\n/);
  const reports: ScannerReport[] = [];
  const seenIds = new Set<number>();
  let currentId: number | null = null;
  let currentBeacons: Vec3[] = [];

  for (let idx = 0; idx < lines.length; idx += 1) {
    const trimmed = lines[idx]!.trim();
    if (trimmed.length === 0) continue;
    const headerMatch = HEADER_RE.exec(trimmed);
    if (headerMatch !== null) {
      if (currentId !== null) reports.push(finalizeSection(currentId, currentBeacons));
      currentId = claimScannerId(headerMatch[1]!, seenIds);
      currentBeacons = [];
    } else if (currentId === null) {
      throw new SyntaxError(`Beacon coordinate appeared before any scanner header on line ${idx + 1}`);
    } else {
      currentBeacons.push(parseBeaconCoord(trimmed, idx + 1));
    }
  }
  if (currentId === null) throw new SyntaxError('Scanner input is empty');
  reports.push(finalizeSection(currentId, currentBeacons));
  return Object.freeze(reports);
}
