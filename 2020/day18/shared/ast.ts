import { applyBinaryOperator, type BinaryOperator } from './policies';

export type ExprNodeKind = 'literal' | 'group' | 'binary';

export interface EvalStepSink {
  recordValue(nodeId: string, value: bigint): void;
  onBinaryOp(node: BinaryExpr, leftValue: bigint, rightValue: bigint, result: bigint): void;
}

export interface ExprNode {
  readonly id: string;
  readonly nodeKind: ExprNodeKind;
  readonly label: string;
  readonly children: readonly ExprNode[];
  readonly binaryOpCount: number;
  evaluate(): bigint;
  collectSteps(sink: EvalStepSink): bigint;
  format(): string;
}

const EMPTY_CHILDREN: readonly ExprNode[] = Object.freeze([]);

/** Leaf integer literal AST node backed by exact BigInt arithmetic. */
export class LiteralExpr implements ExprNode {
  readonly id: string;
  readonly value: bigint;

  constructor(id: string, value: bigint) {
    this.id = id;
    this.value = value;
    Object.freeze(this);
  }

  get nodeKind(): ExprNodeKind {
    return 'literal';
  }

  get label(): string {
    return String(this.value);
  }

  get children(): readonly ExprNode[] {
    return EMPTY_CHILDREN;
  }

  get binaryOpCount(): number {
    return 0;
  }

  evaluate(): bigint {
    return this.value;
  }

  collectSteps(sink: EvalStepSink): bigint {
    sink.recordValue(this.id, this.value);
    return this.value;
  }

  format(): string {
    return String(this.value);
  }
}

/** Parenthesized sub-expression node preserved for explicit AST visualization. */
export class GroupExpr implements ExprNode {
  readonly id: string;
  readonly inner: ExprNode;
  readonly children: readonly ExprNode[];

  constructor(id: string, inner: ExprNode) {
    this.id = id;
    this.inner = inner;
    this.children = Object.freeze([inner]);
    Object.freeze(this);
  }

  get nodeKind(): ExprNodeKind {
    return 'group';
  }

  get label(): string {
    return '( )';
  }

  get binaryOpCount(): number {
    return this.inner.binaryOpCount;
  }

  evaluate(): bigint {
    return this.inner.evaluate();
  }

  collectSteps(sink: EvalStepSink): bigint {
    const value = this.inner.collectSteps(sink);
    sink.recordValue(this.id, value);
    return value;
  }

  format(): string {
    return `(${this.inner.format()})`;
  }
}

/** Binary operator AST node (`+` or `*`). */
export class BinaryExpr implements ExprNode {
  readonly id: string;
  readonly operator: BinaryOperator;
  readonly left: ExprNode;
  readonly right: ExprNode;
  readonly children: readonly ExprNode[];

  constructor(id: string, operator: BinaryOperator, left: ExprNode, right: ExprNode) {
    this.id = id;
    this.operator = operator;
    this.left = left;
    this.right = right;
    this.children = Object.freeze([left, right]);
    Object.freeze(this);
  }

  get nodeKind(): ExprNodeKind {
    return 'binary';
  }

  get label(): string {
    return this.operator;
  }

  get binaryOpCount(): number {
    return 1 + this.left.binaryOpCount + this.right.binaryOpCount;
  }

  evaluate(): bigint {
    return applyBinaryOperator(this.operator, this.left.evaluate(), this.right.evaluate());
  }

  collectSteps(sink: EvalStepSink): bigint {
    const leftValue = this.left.collectSteps(sink);
    const rightValue = this.right.collectSteps(sink);
    const result = applyBinaryOperator(this.operator, leftValue, rightValue);
    sink.recordValue(this.id, result);
    sink.onBinaryOp(this, leftValue, rightValue, result);
    return result;
  }

  format(): string {
    return `${this.left.format()} ${this.operator} ${this.right.format()}`;
  }
}
