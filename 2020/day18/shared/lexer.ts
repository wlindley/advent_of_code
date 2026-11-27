import type { BinaryOperator } from './policies';

export interface NumberToken {
  readonly kind: 'number';
  readonly value: bigint;
  readonly column: number;
}

export interface OperatorToken {
  readonly kind: 'operator';
  readonly operator: BinaryOperator;
  readonly column: number;
}

export interface ParenToken {
  readonly kind: 'paren';
  readonly paren: '(' | ')';
  readonly column: number;
}

export type Token = NumberToken | OperatorToken | ParenToken;

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function readNumberEnd(line: string, start: number): number {
  let end = start + 1;
  while (end < line.length && isDigit(line.charAt(end))) {
    end += 1;
  }
  return end;
}

/** Tokenizes a single expression line into frozen tokens with 1-based column positions. */
export function tokenizeLine(line: string, lineNumber: number): readonly Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line.charAt(i);
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === '+' || ch === '*') {
      tokens.push(Object.freeze({ kind: 'operator', operator: ch, column: i + 1 }));
      i += 1;
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push(Object.freeze({ kind: 'paren', paren: ch, column: i + 1 }));
      i += 1;
      continue;
    }
    if (isDigit(ch)) {
      const end = readNumberEnd(line, i);
      tokens.push(Object.freeze({ kind: 'number', value: BigInt(line.slice(i, end)), column: i + 1 }));
      i = end;
      continue;
    }
    throw new SyntaxError(`Unexpected character '${ch}' at line ${lineNumber}, column ${i + 1}`);
  }
  return Object.freeze(tokens);
}
