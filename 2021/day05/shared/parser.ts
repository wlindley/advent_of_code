import { VentField, VentPoint, VentSegment } from './types';

const SEGMENT_LINE_PATTERN = /^(-?\d+)\s*,\s*(-?\d+)\s*->\s*(-?\d+)\s*,\s*(-?\d+)$/;

function parseSegmentLine(line: string, lineNumber: number): VentSegment {
  const match = SEGMENT_LINE_PATTERN.exec(line);
  if (match === null) {
    throw new SyntaxError(`Line ${lineNumber}: invalid vent segment "${line}"`);
  }
  try {
    const start = new VentPoint(Number(match[1]), Number(match[2]));
    const end = new VentPoint(Number(match[3]), Number(match[4]));
    return new VentSegment(start, end);
  } catch (error) {
    throw new RangeError(`Line ${lineNumber}: ${(error as RangeError).message}`);
  }
}

/** Parses hydrothermal vent segment lines into an immutable VentField. */
export function parseVentField(raw: string): VentField {
  const lines = raw.split(/\r?\n/);
  const segments: VentSegment[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    segments.push(parseSegmentLine(trimmed, i + 1));
  }
  if (segments.length === 0) {
    throw new RangeError('Vent field input cannot be empty');
  }
  return new VentField(segments);
}
