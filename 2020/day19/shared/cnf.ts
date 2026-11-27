import type { Grammar } from './grammar';

interface BinaryEdge {
  readonly lhs: number;
  readonly left: number;
  readonly right: number;
}

interface CsrArrays {
  readonly start: Int32Array;
  readonly colA: Int32Array;
  readonly colB: Int32Array;
}

/** Packed bitset-and-CSR Chomsky Normal Form representation of a Grammar. */
export class CnfGrammar {
  readonly wordCount: number;
  readonly origWordCount: number;
  readonly lastOrigWordMask: number;
  readonly leftStart: Int32Array;
  readonly leftRight: Int32Array;
  readonly leftLhs: Int32Array;
  readonly lhsStart: Int32Array;
  readonly lhsLeft: Int32Array;
  readonly lhsRight: Int32Array;

  constructor(
    readonly startSymbol: number,
    readonly origCount: number,
    readonly symbolCount: number,
    readonly symToRuleId: Int32Array,
    readonly rule42Sym: number,
    readonly rule31Sym: number,
    readonly terminalMasks: Uint32Array,
    leftCsr: CsrArrays,
    lhsCsr: CsrArrays,
  ) {
    this.wordCount = Math.ceil(symbolCount / 32);
    this.origWordCount = Math.ceil(origCount / 32);
    this.lastOrigWordMask = -1 >>> (32 - ((origCount - 1) & 31) - 1);
    this.leftStart = leftCsr.start;
    this.leftRight = leftCsr.colA;
    this.leftLhs = leftCsr.colB;
    this.lhsStart = lhsCsr.start;
    this.lhsLeft = lhsCsr.colA;
    this.lhsRight = lhsCsr.colB;
    Object.freeze(this);
  }

  get syntheticCount(): number {
    return this.symbolCount - this.origCount;
  }

  get binaryRuleCount(): number {
    return this.leftLhs.length;
  }
}

function appendSequence(
  lhs: number,
  syms: readonly number[],
  nextSynth: number,
  unitParents: readonly number[][],
  rawBinaries: BinaryEdge[],
): number {
  if (syms.length === 1) {
    unitParents[syms[0]!]!.push(lhs);
    return nextSynth;
  }
  let cur = lhs;
  for (let j = 0; j <= syms.length - 3; j += 1) {
    const synth = nextSynth++;
    rawBinaries.push({ lhs: cur, left: syms[j]!, right: synth });
    cur = synth;
  }
  rawBinaries.push({ lhs: cur, left: syms[syms.length - 2]!, right: syms[syms.length - 1]! });
  return nextSynth;
}

function collectRawData(grammar: Grammar, ruleIdToSym: ReadonlyMap<number, number>) {
  const origCount = grammar.ruleCount;
  let nextSynth = origCount;
  const terminals: { sym: number; letter: number }[] = [];
  const rawBinaries: BinaryEdge[] = [];
  const unitParents: number[][] = Array.from({ length: origCount }, () => []);
  for (let i = 0; i < origCount; i += 1) {
    const rule = grammar.rules[i]!;
    if (rule.kind === 'terminal') {
      terminals.push({ sym: i, letter: rule.symbol.charCodeAt(0) - 97 });
      continue;
    }
    for (const alt of rule.alternatives) {
      const syms = alt.map((id) => ruleIdToSym.get(id)!);
      nextSynth = appendSequence(i, syms, nextSynth, unitParents, rawBinaries);
    }
  }
  return { symbolCount: nextSynth, terminals, rawBinaries, unitParents };
}

function collectAncestors(
  startSym: number,
  unitParents: readonly number[][],
  visitStamp: Int32Array,
  stamp: number,
  queue: number[],
): number[] {
  if (startSym >= unitParents.length) return [startSym];
  queue.length = 0;
  queue.push(startSym);
  visitStamp[startSym] = stamp;
  for (let head = 0; head < queue.length; head += 1) {
    for (const parent of unitParents[queue[head]!]!) {
      if (visitStamp[parent]! !== stamp) {
        visitStamp[parent] = stamp;
        queue.push(parent);
      }
    }
  }
  return queue;
}

function expandBinaryEdges(
  rawBinaries: readonly BinaryEdge[],
  unitParents: readonly number[][],
  visitStamp: Int32Array,
  startStamp: number,
): readonly BinaryEdge[] {
  const seen = new Set<string>();
  const edges: BinaryEdge[] = [];
  const queue: number[] = [];
  let stamp = startStamp;
  for (const bin of rawBinaries) {
    for (const anc of collectAncestors(bin.lhs, unitParents, visitStamp, stamp++, queue)) {
      const key = `${anc}:${bin.left}:${bin.right}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ lhs: anc, left: bin.left, right: bin.right });
      }
    }
  }
  return edges;
}

function packCsr(
  symbolCount: number,
  edges: readonly BinaryEdge[],
  keyOf: (edge: BinaryEdge) => number,
  valAOf: (edge: BinaryEdge) => number,
  valBOf: (edge: BinaryEdge) => number,
): CsrArrays {
  const start = new Int32Array(symbolCount + 1);
  for (const edge of edges) start[keyOf(edge) + 1]! += 1;
  for (let i = 1; i <= symbolCount; i += 1) start[i]! += start[i - 1]!;
  const cursor = new Int32Array(start);
  const colA = new Int32Array(edges.length);
  const colB = new Int32Array(edges.length);
  for (const edge of edges) {
    const pos = cursor[keyOf(edge)]!++;
    colA[pos] = valAOf(edge);
    colB[pos] = valBOf(edge);
  }
  return { start, colA, colB };
}

/** Compiles a validated Grammar into a packed bitset/CSR CnfGrammar for CYK matching. */
export function compileCnf(grammar: Grammar): CnfGrammar {
  const origCount = grammar.ruleCount;
  const symToRuleId = new Int32Array(origCount);
  const ruleIdToSym = new Map<number, number>();
  for (let i = 0; i < origCount; i += 1) {
    symToRuleId[i] = grammar.rules[i]!.id;
    ruleIdToSym.set(symToRuleId[i]!, i);
  }
  const raw = collectRawData(grammar, ruleIdToSym);
  const wordCount = Math.ceil(raw.symbolCount / 32);
  const visitStamp = new Int32Array(origCount);
  const terminalMasks = new Uint32Array(26 * wordCount);
  const queue: number[] = [];
  let stamp = 1;
  for (const term of raw.terminals) {
    const base = term.letter * wordCount;
    for (const anc of collectAncestors(term.sym, raw.unitParents, visitStamp, stamp++, queue)) {
      terminalMasks[base + (anc >>> 5)]! |= 1 << (anc & 31);
    }
  }
  const edges = expandBinaryEdges(raw.rawBinaries, raw.unitParents, visitStamp, stamp);
  const leftCsr = packCsr(raw.symbolCount, edges, (e) => e.left, (e) => e.right, (e) => e.lhs);
  const lhsCsr = packCsr(raw.symbolCount, edges, (e) => e.lhs, (e) => e.left, (e) => e.right);
  return new CnfGrammar(
    ruleIdToSym.get(0)!, origCount, raw.symbolCount, symToRuleId,
    ruleIdToSym.get(42) ?? -1, ruleIdToSym.get(31) ?? -1, terminalMasks, leftCsr, lhsCsr,
  );
}
