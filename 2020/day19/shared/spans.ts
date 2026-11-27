import type { CnfGrammar } from './cnf';
import { type CykChart, fillCykChart } from './cyk';

export type SpanRole = 'rule42' | 'rule31' | 'rule';
export type TriangleCellCode = '0' | 'w' | '4' | '3' | 'r' | '.';

export interface DerivationSpan {
  readonly ruleId: number;
  readonly start: number;
  readonly len: number;
  readonly depth: number;
  readonly role: SpanRole;
}

export interface CykAnalysis {
  readonly message: string;
  readonly matched: boolean;
  readonly spans: readonly DerivationSpan[];
  readonly triangleRows: readonly string[];
}

interface WitnessSplit {
  readonly split: number;
  readonly leftSym: number;
  readonly rightSym: number;
}

function spanRole(sym: number, cnf: CnfGrammar): SpanRole {
  if (sym === cnf.rule42Sym) return 'rule42';
  if (sym === cnf.rule31Sym) return 'rule31';
  return 'rule';
}

function findWitnessSplit(
  cnf: CnfGrammar,
  chart: CykChart,
  start: number,
  len: number,
  sym: number,
): WitnessSplit {
  let found = false;
  let bestSplit = 1;
  let bestLeft = 0;
  let bestRight = 0;
  const pEnd = cnf.lhsStart[sym + 1]!;
  for (let p = cnf.lhsStart[sym]! ; p < pEnd && !found; p += 1) {
    const leftSym = cnf.lhsLeft[p]!;
    const rightSym = cnf.lhsRight[p]!;
    for (let split = 1; split < len && !found; split += 1) {
      if (chart.has(start, split, leftSym) && chart.has(start + split, len - split, rightSym)) {
        found = true;
        bestSplit = split;
        bestLeft = leftSym;
        bestRight = rightSym;
      }
    }
  }
  return { split: bestSplit, leftSym: bestLeft, rightSym: bestRight };
}

function collectWitness(
  cnf: CnfGrammar,
  chart: CykChart,
  start: number,
  len: number,
  sym: number,
  depth: number,
  spans: DerivationSpan[],
  witnessCells: Set<string>,
): void {
  const isOriginal = sym < cnf.origCount;
  if (isOriginal) {
    witnessCells.add(`${start}:${len}`);
    spans.push(Object.freeze({
      ruleId: cnf.symToRuleId[sym]!,
      start,
      len,
      depth,
      role: spanRole(sym, cnf),
    }));
    if (len === 1) return;
  }
  const childDepth = isOriginal ? depth + 1 : depth;
  const { split, leftSym, rightSym } = findWitnessSplit(cnf, chart, start, len, sym);
  collectWitness(cnf, chart, start, split, leftSym, childDepth, spans, witnessCells);
  collectWitness(cnf, chart, start + split, len - split, rightSym, childDepth, spans, witnessCells);
}

function classifyCell(
  cnf: CnfGrammar,
  chart: CykChart,
  start: number,
  len: number,
  witnessCells: ReadonlySet<string>,
): TriangleCellCode {
  if (chart.has(start, len, cnf.startSymbol)) return '0';
  if (cnf.rule42Sym >= 0 && chart.has(start, len, cnf.rule42Sym)) return '4';
  if (cnf.rule31Sym >= 0 && chart.has(start, len, cnf.rule31Sym)) return '3';
  if (witnessCells.has(`${start}:${len}`)) return 'w';
  if (chart.hasAnyOriginal(start, len)) return 'r';
  return '.';
}

function buildTriangleRows(
  cnf: CnfGrammar,
  chart: CykChart,
  witnessCells: ReadonlySet<string>,
): readonly string[] {
  const rows: string[] = [];
  for (let len = 1; len <= chart.length; len += 1) {
    let row = '';
    for (let start = 0; start <= chart.length - len; start += 1) {
      row += classifyCell(cnf, chart, start, len, witnessCells);
    }
    rows.push(row);
  }
  return Object.freeze(rows);
}

/** Runs CYK on `message`, extracts an unfolded witness derivation tree, and summarizes the triangle. */
export function analyzeMessage(cnf: CnfGrammar, message: string): CykAnalysis {
  const chart = fillCykChart(cnf, message);
  const matched = chart.has(0, message.length, cnf.startSymbol);
  const spans: DerivationSpan[] = [];
  const witnessCells = new Set<string>();
  if (matched) {
    collectWitness(cnf, chart, 0, message.length, cnf.startSymbol, 0, spans, witnessCells);
  }
  const triangleRows = buildTriangleRows(cnf, chart, witnessCells);
  return Object.freeze({
    message,
    matched,
    spans: Object.freeze(spans),
    triangleRows,
  });
}
