export type TerminalLine =
  | { readonly kind: 'cd-root' }
  | { readonly kind: 'cd-up' }
  | { readonly kind: 'cd-child'; readonly name: string }
  | { readonly kind: 'ls' }
  | { readonly kind: 'dir-entry'; readonly name: string }
  | { readonly kind: 'file-entry'; readonly name: string; readonly size: number };

const ENTRY_NAME_PATTERN = /^[^\s/]+$/;
const NON_NEGATIVE_INT_PATTERN = /^\d+$/;

/** Returns true when `name` is a single non-empty path segment without slashes or dot refs. */
export function isValidEntryName(name: string): boolean {
  return ENTRY_NAME_PATTERN.test(name) && name !== '.' && name !== '..';
}

function parseCommandLine(line: string, lineNumber: number): TerminalLine {
  const body = line.slice(2).trim();
  if (body === 'ls') return Object.freeze({ kind: 'ls' });
  if (body === 'cd /') return Object.freeze({ kind: 'cd-root' });
  if (body === 'cd ..') return Object.freeze({ kind: 'cd-up' });
  if (body.startsWith('cd ')) {
    const name = body.slice(3).trim();
    if (!isValidEntryName(name)) {
      throw new Error(`Invalid cd target "${name}" at line ${lineNumber}`);
    }
    return Object.freeze({ kind: 'cd-child', name });
  }
  throw new Error(`Unsupported command "${line}" at line ${lineNumber}`);
}

function parseListingLine(line: string, lineNumber: number): TerminalLine {
  const space = line.indexOf(' ');
  if (space < 0) {
    throw new Error(`Malformed listing line "${line}" at line ${lineNumber}`);
  }
  const head = line.slice(0, space);
  const name = line.slice(space + 1).trim();
  if (!isValidEntryName(name)) {
    throw new Error(`Invalid entry name "${name}" at line ${lineNumber}`);
  }
  if (head === 'dir') {
    return Object.freeze({ kind: 'dir-entry', name });
  }
  if (!NON_NEGATIVE_INT_PATTERN.test(head)) {
    throw new Error(`Invalid file size "${head}" at line ${lineNumber}`);
  }
  const size = Number(head);
  if (!Number.isSafeInteger(size)) {
    throw new RangeError(`File size exceeds safe integer at line ${lineNumber}: ${head}`);
  }
  return Object.freeze({ kind: 'file-entry', name, size });
}

/** Parses an AoC terminal session log into frozen discriminated line commands/entries. */
export function parseTerminalLog(raw: string): readonly TerminalLine[] {
  const rawLines = raw.split(/\r?\n/);
  const parsed: TerminalLine[] = [];
  for (let i = 0; i < rawLines.length; i += 1) {
    const trimmed = rawLines[i]!.trim();
    if (trimmed.length === 0) continue;
    const lineNumber = i + 1;
    parsed.push(trimmed.startsWith('$ ') ? parseCommandLine(trimmed, lineNumber) : parseListingLine(trimmed, lineNumber));
  }
  if (parsed.length === 0) {
    throw new Error('Terminal log must contain at least one non-empty line');
  }
  return Object.freeze(parsed);
}
