import { DirectedGraph } from '../../../shared/core';

const LINE_RE = /^([A-Za-z0-9_-]+):(.*)$/;
const TOKEN_RE = /^[A-Za-z0-9_-]+$/;

/** Parses `src: dst1 dst2` reactor wiring lines into an immutable DirectedGraph. */
export function parseReactorGraph(raw: string): DirectedGraph<string> {
  const entries: [string, string[]][] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    const match = LINE_RE.exec(line);
    if (!match) throw new Error(`Invalid reactor line: ${line}`);
    const [, source, rhs] = match;
    const trimmedRhs = rhs!.trim();
    const targets = trimmedRhs.length === 0 ? [] : trimmedRhs.split(/\s+/);
    for (const target of targets) {
      if (!TOKEN_RE.test(target)) throw new Error(`Invalid target token "${target}" on line: ${line}`);
    }
    entries.push([source!, targets]);
  }
  if (entries.length === 0) throw new Error('Reactor input must not be empty');
  return new DirectedGraph(entries);
}
