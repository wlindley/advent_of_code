import { OrbitMap } from './orbitMap';
import type { OrbitEdge } from './types';

/** Parses newline-delimited `PARENT)CHILD` orbit edges into a validated `OrbitMap`. */
export function parseOrbitMap(raw: string): OrbitMap {
  const edges: OrbitEdge[] = [];
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    const parts = trimmed.split(')');
    if (parts.length !== 2) {
      throw new SyntaxError(`Invalid orbit edge on line ${i + 1}: ${trimmed}`);
    }
    edges.push({ parent: parts[0]!.trim(), child: parts[1]!.trim() });
  }
  return new OrbitMap(edges);
}
