import { DoorCode } from './model';

/** Parses newline-delimited door codes, skipping blank lines and rejecting empty input. */
export function parseDoorCodes(raw: string): readonly DoorCode[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const codes: DoorCode[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      codes.push(new DoorCode(trimmed));
    }
  }
  if (codes.length === 0) {
    throw new RangeError('Input must contain at least one door code');
  }
  return Object.freeze(codes);
}
