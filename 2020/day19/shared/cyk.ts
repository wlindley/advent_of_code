import type { CnfGrammar } from './cnf';

function cellIndex(start: number, len: number, totalLen: number): number {
  return (((len - 1) * (2 * totalLen - len + 2)) >>> 1) + start;
}

/** Flat triangular CYK bitset chart over a single message. */
export class CykChart {
  readonly wordCount: number;
  readonly origWordCount: number;
  readonly lastOrigWordMask: number;

  constructor(cnf: CnfGrammar, readonly length: number, readonly words: Uint32Array) {
    this.wordCount = cnf.wordCount;
    this.origWordCount = cnf.origWordCount;
    this.lastOrigWordMask = cnf.lastOrigWordMask;
    Object.freeze(this);
  }

  cellOffset(start: number, len: number): number {
    return cellIndex(start, len, this.length) * this.wordCount;
  }

  has(start: number, len: number, sym: number): boolean {
    const off = this.cellOffset(start, len) + (sym >>> 5);
    return (this.words[off]! & (1 << (sym & 31))) !== 0;
  }

  hasAnyOriginal(start: number, len: number): boolean {
    const base = this.cellOffset(start, len);
    const lastWord = this.origWordCount - 1;
    for (let w = 0; w < lastWord; w += 1) if (this.words[base + w]! !== 0) return true;
    return (this.words[base + lastWord]! & this.lastOrigWordMask) !== 0;
  }
}

interface CykScratch {
  readonly nonEmpty: Uint32Array;
  readonly activeSplits: Int32Array;
  readonly activeCount: Int32Array;
  readonly rowStarts: Int32Array;
}

function createScratch(maxLen: number): CykScratch {
  return {
    nonEmpty: new Uint32Array((maxLen * (maxLen + 1)) >>> 1),
    activeSplits: new Int32Array(maxLen * maxLen),
    activeCount: new Int32Array(maxLen),
    rowStarts: new Int32Array(maxLen + 1),
  };
}

function combinePair(
  cnf: CnfGrammar,
  words: Uint32Array,
  nonEmpty: Uint32Array,
  leftBase: number,
  rightBase: number,
  targetIdx: number,
  targetBase: number,
): void {
  for (let w = 0; w < cnf.wordCount; w += 1) {
    let bits = words[leftBase + w]!;
    const symBase = w << 5;
    while (bits !== 0) {
      const lsb = bits & -bits;
      const leftSym = symBase + 31 - Math.clz32(lsb);
      bits ^= lsb;
      const pEnd = cnf.leftStart[leftSym + 1]!;
      for (let p = cnf.leftStart[leftSym]!; p < pEnd; p += 1) {
        const rightSym = cnf.leftRight[p]!;
        if ((words[rightBase + (rightSym >>> 5)]! & (1 << (rightSym & 31))) !== 0) {
          const lhsSym = cnf.leftLhs[p]!;
          const bit = 1 << (lhsSym & 31);
          words[targetBase + (lhsSym >>> 5)]! |= bit;
          nonEmpty[targetIdx]! |= bit;
        }
      }
    }
  }
}

function seedTerminals(cnf: CnfGrammar, msg: string, words: Uint32Array, scratch: CykScratch): void {
  const n = msg.length;
  const wc = cnf.wordCount;
  scratch.activeCount.fill(0, 0, n);
  for (let len = 1; len < n; len += 1) scratch.rowStarts[len + 1] = scratch.rowStarts[len]! + (n - len + 1);
  for (let i = 0; i < n; i += 1) {
    const srcBase = (msg.charCodeAt(i) - 97) * wc;
    const dstBase = i * wc;
    let any = 0;
    for (let w = 0; w < wc; w += 1) {
      const mask = cnf.terminalMasks[srcBase + w]!;
      words[dstBase + w] = mask;
      any |= mask;
    }
    scratch.nonEmpty[i] = any;
    if (any !== 0) { scratch.activeSplits[i * n] = 1; scratch.activeCount[i] = 1; }
  }
}

function fillWords(cnf: CnfGrammar, msg: string, words: Uint32Array, scratch: CykScratch): void {
  const n = msg.length;
  const wc = cnf.wordCount;
  seedTerminals(cnf, msg, words, scratch);
  for (let len = 2; len <= n; len += 1) {
    const rowBase = scratch.rowStarts[len]!;
    for (let start = 0; start <= n - len; start += 1) {
      const targetIdx = rowBase + start;
      const count = scratch.activeCount[start]!;
      const listBase = start * n;
      for (let idx = 0; idx < count; idx += 1) {
        const split = scratch.activeSplits[listBase + idx]!;
        const rightIdx = scratch.rowStarts[len - split]! + start + split;
        if (scratch.nonEmpty[rightIdx]! !== 0) {
          const leftIdx = scratch.rowStarts[split]! + start;
          combinePair(cnf, words, scratch.nonEmpty, leftIdx * wc, rightIdx * wc, targetIdx, targetIdx * wc);
        }
      }
      if (scratch.nonEmpty[targetIdx]! !== 0) { scratch.activeSplits[listBase + count] = len; scratch.activeCount[start] = count + 1; }
    }
  }
}

function seedTerminalBounds(cnf: CnfGrammar, minLen: Float64Array, maxLen: Float64Array): void {
  for (let c = 0; c < 26; c += 1) {
    for (let w = 0; w < cnf.wordCount; w += 1) {
      let bits = cnf.terminalMasks[c * cnf.wordCount + w]!;
      while (bits !== 0) {
        const lsb = bits & -bits;
        const sym = (w << 5) + 31 - Math.clz32(lsb);
        bits ^= lsb;
        minLen[sym] = 1; maxLen[sym] = 1;
      }
    }
  }
}

function computeStartBounds(cnf: CnfGrammar): { readonly min: number; readonly max: number } {
  const nSym = cnf.symbolCount;
  const minLen = new Float64Array(nSym).fill(Infinity);
  const maxLen = new Float64Array(nSym).fill(0);
  seedTerminalBounds(cnf, minLen, maxLen);
  for (let pass = 0, changed = true; changed; pass += 1) {
    changed = false;
    for (let lhs = 0; lhs < nSym; lhs += 1) {
      for (let p = cnf.lhsStart[lhs]!; p < cnf.lhsStart[lhs + 1]!; p += 1) {
        const cm = minLen[cnf.lhsLeft[p]!]! + minLen[cnf.lhsRight[p]!]!;
        if (cm < minLen[lhs]!) { minLen[lhs] = cm; changed = true; }
        const cx = maxLen[cnf.lhsLeft[p]!]! + maxLen[cnf.lhsRight[p]!]!;
        if (cm < Infinity && cx > maxLen[lhs]!) { maxLen[lhs] = pass >= nSym ? Infinity : cx; changed = true; }
      }
    }
  }
  return { min: minLen[cnf.startSymbol]!, max: maxLen[cnf.startSymbol]! };
}

/** Fills a triangular CYK bitset chart for `message` using an optional reusable buffer. */
export function fillCykChart(cnf: CnfGrammar, message: string, buffer?: Uint32Array): CykChart {
  const n = message.length;
  const req = ((n * (n + 1)) >>> 1) * cnf.wordCount;
  const words = buffer && buffer.length >= req ? (buffer.fill(0, 0, req), buffer) : new Uint32Array(req);
  fillWords(cnf, message, words, createScratch(n));
  return new CykChart(cnf, n, words);
}

/** Returns true iff `message` is derived by rule 0 of `cnf`. */
export function matchesMessage(cnf: CnfGrammar, message: string, buffer?: Uint32Array): boolean {
  return fillCykChart(cnf, message, buffer).has(0, message.length, cnf.startSymbol);
}

/** Counts how many messages in `messages` match rule 0 of `cnf` using one shared buffer. */
export function countMatchingMessages(cnf: CnfGrammar, messages: readonly string[]): number {
  const bounds = computeStartBounds(cnf);
  let maxLen = 0;
  for (const m of messages) if (m.length >= bounds.min && m.length <= bounds.max && m.length > maxLen) maxLen = m.length;
  const buffer = new Uint32Array(((maxLen * (maxLen + 1)) >>> 1) * cnf.wordCount);
  const scratch = createScratch(maxLen);
  let matches = 0;
  for (const msg of messages) {
    const n = msg.length;
    if (n < bounds.min || n > bounds.max) continue;
    buffer.fill(0, 0, ((n * (n + 1)) >>> 1) * cnf.wordCount);
    scratch.nonEmpty.fill(0, 0, (n * (n + 1)) >>> 1);
    fillWords(cnf, msg, buffer, scratch);
    const topOff = scratch.rowStarts[n]! * cnf.wordCount + (cnf.startSymbol >>> 5);
    if ((buffer[topOff]! & (1 << (cnf.startSymbol & 31))) !== 0) matches += 1;
  }
  return matches;
}
