export interface WiringEdge {
  readonly u: number;
  readonly v: number;
}

interface ParsedLine {
  readonly lhs: string;
  readonly rhs: readonly string[];
}

const LABEL_RE = /^[a-zA-Z0-9_-]+$/;

function checkLabel(label: string, lineNumber: number): void {
  if (!LABEL_RE.test(label)) throw new Error(`Invalid component label "${label}" on line ${lineNumber}`);
}

function parseLine(rawLine: string, lineNumber: number): ParsedLine {
  const colonIdx = rawLine.indexOf(':');
  if (colonIdx === -1 || rawLine.indexOf(':', colonIdx + 1) !== -1) {
    throw new Error(`Expected exactly one colon on line ${lineNumber}`);
  }
  const lhs = rawLine.slice(0, colonIdx).trim();
  if (lhs.length === 0) throw new Error(`Empty left-hand component on line ${lineNumber}`);
  checkLabel(lhs, lineNumber);
  const rhsText = rawLine.slice(colonIdx + 1).trim();
  if (rhsText.length === 0) throw new Error(`Empty right-hand neighbor list on line ${lineNumber}`);
  const rhs = rhsText.split(/\s+/);
  for (let i = 0; i < rhs.length; i += 1) {
    const neighbor = rhs[i]!;
    checkLabel(neighbor, lineNumber);
    if (neighbor === lhs) throw new Error(`Self-loop "${lhs}" on line ${lineNumber}`);
  }
  return { lhs, rhs };
}

function compareEdges(a: WiringEdge, b: WiringEdge): number {
  return a.u !== b.u ? a.u - b.u : a.v - b.v;
}

function buildCanonicalEdges(
  records: readonly ParsedLine[],
  indexByLabel: ReadonlyMap<string, number>,
): WiringEdge[] {
  const n = indexByLabel.size;
  const seen = new Set<number>();
  const edges: WiringEdge[] = [];
  for (let i = 0; i < records.length; i += 1) {
    const rec = records[i]!;
    const u0 = indexByLabel.get(rec.lhs)!;
    for (let j = 0; j < rec.rhs.length; j += 1) {
      const v0 = indexByLabel.get(rec.rhs[j]!)!;
      const u = u0 < v0 ? u0 : v0;
      const v = u0 < v0 ? v0 : u0;
      const key = u * n + v;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(Object.freeze({ u, v }));
    }
  }
  edges.sort(compareEdges);
  return edges;
}

/**
 * Undirected wiring graph backed by sorted labels and flat forward-star TypedArrays.
 * Half-edge `2e` points `u -> v` and `2e ^ 1` points `v -> u` for O(1) reversal.
 */
export class WiringGraph {
  readonly labels: readonly string[];
  readonly edges: readonly WiringEdge[];
  private readonly head: Int32Array;
  private readonly to: Int32Array;
  private readonly next: Int32Array;

  constructor(labels: readonly string[], edges: readonly WiringEdge[]) {
    this.labels = Object.freeze([...labels]);
    this.edges = Object.freeze([...edges]);
    this.head = new Int32Array(labels.length).fill(-1);
    this.to = new Int32Array(edges.length * 2);
    this.next = new Int32Array(edges.length * 2);
    for (let e = 0; e < edges.length; e += 1) {
      const { u, v } = edges[e]!;
      const he0 = e << 1;
      const he1 = he0 | 1;
      this.to[he0] = v;
      this.next[he0] = this.head[u]!;
      this.head[u] = he0;
      this.to[he1] = u;
      this.next[he1] = this.head[v]!;
      this.head[v] = he1;
    }
    Object.freeze(this);
  }

  get vertexCount(): number { return this.labels.length; }
  get edgeCount(): number { return this.edges.length; }
  firstHalfEdge(u: number): number { return this.head[u]!; }
  targetOf(he: number): number { return this.to[he]!; }
  nextHalfEdge(he: number): number { return this.next[he]!; }
  edgeOf(he: number): number { return he >> 1; }
  labelOf(u: number): string { return this.labels[u]!; }
}

/** Parses `component: neighbor1 neighbor2 ...` lines into a canonical WiringGraph. */
export function parseWiringGraph(raw: string): WiringGraph {
  const lines = raw.split(/\r?\n/);
  const records: ParsedLine[] = [];
  const labelSet = new Set<string>();
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    const parsed = parseLine(trimmed, i + 1);
    records.push(parsed);
    labelSet.add(parsed.lhs);
    for (let j = 0; j < parsed.rhs.length; j += 1) labelSet.add(parsed.rhs[j]!);
  }
  if (records.length === 0) throw new Error('Wiring graph input is empty');
  const labels = Array.from(labelSet).sort();
  const indexByLabel = new Map<string, number>();
  for (let i = 0; i < labels.length; i += 1) indexByLabel.set(labels[i]!, i);
  return new WiringGraph(labels, buildCanonicalEdges(records, indexByLabel));
}
