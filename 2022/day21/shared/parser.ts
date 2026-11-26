import { isBinaryOp } from './operators';
import { type MonkeyJob, MonkeyRiddle } from './riddle';

const LINE_RE = /^([^:\s]+):\s*(.+)$/;
const LITERAL_RE = /^-?\d+$/;
const OP_RE = /^(\S+)\s+(\S+)\s+(\S+)$/;

function parseMonkeyLine(rawLine: string, lineNumber: number): MonkeyJob {
  const lineMatch = LINE_RE.exec(rawLine);
  if (!lineMatch) {
    throw new SyntaxError(`Line ${lineNumber}: expected "<name>: <job>", got "${rawLine}"`);
  }
  const name = lineMatch[1]!;
  const rhs = lineMatch[2]!.trim();
  if (LITERAL_RE.test(rhs)) {
    return { kind: 'literal', name, value: BigInt(rhs) };
  }
  const opMatch = OP_RE.exec(rhs);
  if (!opMatch) {
    throw new SyntaxError(`Line ${lineNumber}: invalid job expression "${rhs}"`);
  }
  const op = opMatch[2]!;
  if (!isBinaryOp(op)) {
    throw new SyntaxError(`Line ${lineNumber}: unsupported operator "${op}"`);
  }
  return { kind: 'op', name, left: opMatch[1]!, op, right: opMatch[3]! };
}

/** Parses raw puzzle text into a validated `MonkeyRiddle`. */
export function parseMonkeyRiddle(raw: string): MonkeyRiddle {
  const jobs: MonkeyJob[] = [];
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    jobs.push(parseMonkeyLine(trimmed, i + 1));
  }
  return new MonkeyRiddle(jobs);
}
