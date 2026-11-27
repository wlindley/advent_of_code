import { CaveSystem, type CaveEdge } from './cave';

function parseEdgeLine(rawLine: string, lineNumber: number): CaveEdge {
  const parts = rawLine.trim().split('-');
  if (parts.length !== 2) {
    throw new Error(`Invalid cave connection on line ${lineNumber}: "${rawLine}"`);
  }
  return { a: parts[0]!, b: parts[1]! };
}

/** Parses newline-delimited `a-b` cave passage lines into a validated `CaveSystem`. */
export function parseCaveSystem(raw: string): CaveSystem {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Cave passage input cannot be empty');
  }
  const lines = trimmed.split(/\r?\n/);
  const edges: CaveEdge[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    edges.push(parseEdgeLine(lines[i]!, i + 1));
  }
  return new CaveSystem(edges);
}
