import { BinaryExpr, type ExprNode, GroupExpr, LiteralExpr } from './ast';
import { type Token, tokenizeLine } from './lexer';
import type { PrecedencePolicy } from './policies';

export interface ParsedExpression {
  readonly lineNumber: number;
  readonly source: string;
  readonly root: ExprNode;
}

/** Parsed multi-line homework program parameterized by an operator precedence policy. */
export class HomeworkProgram {
  readonly policy: PrecedencePolicy;
  readonly expressions: readonly ParsedExpression[];

  constructor(policy: PrecedencePolicy, expressions: readonly ParsedExpression[]) {
    this.policy = policy;
    this.expressions = expressions;
    Object.freeze(this);
  }

  get totalSteps(): number {
    let steps = 0;
    for (const expr of this.expressions) {
      steps += Math.max(1, expr.root.binaryOpCount);
    }
    return steps;
  }

  evaluateSum(): bigint {
    let sum = 0n;
    for (const expr of this.expressions) {
      sum += expr.root.evaluate();
    }
    return sum;
  }
}

function formatToken(token: Token): string {
  if (token.kind === 'number') return String(token.value);
  if (token.kind === 'operator') return token.operator;
  return token.paren;
}

class PrattParser {
  private readonly tokens: readonly Token[];
  private readonly lineNumber: number;
  private readonly policy: PrecedencePolicy;
  private cursor = 0;
  private nextNodeId = 0;

  constructor(tokens: readonly Token[], lineNumber: number, policy: PrecedencePolicy) {
    this.tokens = tokens;
    this.lineNumber = lineNumber;
    this.policy = policy;
  }

  parseRoot(): ExprNode {
    const expr = this.parsePrecedence(1);
    const trailing = this.peek();
    if (trailing !== undefined) {
      throw new SyntaxError(
        `Unexpected token '${formatToken(trailing)}' at line ${this.lineNumber}, column ${trailing.column}`,
      );
    }
    return expr;
  }

  private peek(): Token | undefined {
    return this.tokens[this.cursor];
  }

  private consume(): Token {
    const token = this.tokens[this.cursor]!;
    this.cursor += 1;
    return token;
  }

  private allocateId(): string {
    const id = `n${this.nextNodeId}`;
    this.nextNodeId += 1;
    return id;
  }

  private parsePrecedence(minPrec: number): ExprNode {
    let left = this.parsePrimary();
    while (true) {
      const next = this.peek();
      if (next === undefined || next.kind !== 'operator') break;
      const prec = this.policy.precedence[next.operator];
      if (prec < minPrec) break;
      this.consume();
      const right = this.parsePrecedence(prec + 1);
      left = new BinaryExpr(this.allocateId(), next.operator, left, right);
    }
    return left;
  }

  private parsePrimary(): ExprNode {
    const token = this.peek();
    if (token === undefined) {
      throw new SyntaxError(`Unexpected end of expression on line ${this.lineNumber}`);
    }
    if (token.kind === 'number') {
      this.consume();
      return new LiteralExpr(this.allocateId(), token.value);
    }
    if (token.kind === 'paren' && token.paren === '(') {
      this.consume();
      return this.parseGroup(token.column);
    }
    throw new SyntaxError(
      `Expected operand or '(' at line ${this.lineNumber}, column ${token.column}, got '${formatToken(token)}'`,
    );
  }

  private parseGroup(openColumn: number): ExprNode {
    const inner = this.parsePrecedence(1);
    const closing = this.peek();
    if (closing === undefined) {
      throw new SyntaxError(`Unclosed '(' at line ${this.lineNumber}, column ${openColumn}`);
    }
    if (closing.kind !== 'paren' || closing.paren !== ')') {
      throw new SyntaxError(
        `Expected ')' to close '(' from column ${openColumn} at line ${this.lineNumber}, column ${closing.column}, got '${formatToken(closing)}'`,
      );
    }
    this.consume();
    return new GroupExpr(this.allocateId(), inner);
  }
}

/** Parses multi-line homework input into a frozen HomeworkProgram using the given precedence policy. */
export function parseHomework(raw: string, policy: PrecedencePolicy): HomeworkProgram {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const expressions: ParsedExpression[] = [];
  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx]!;
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const lineNumber = idx + 1;
    const tokens = tokenizeLine(line, lineNumber);
    const root = new PrattParser(tokens, lineNumber, policy).parseRoot();
    expressions.push(Object.freeze({ lineNumber, source: trimmed, root }));
  }
  if (expressions.length === 0) {
    throw new SyntaxError('Homework input must contain at least one expression');
  }
  return new HomeworkProgram(policy, Object.freeze(expressions));
}
