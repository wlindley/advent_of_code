import { describe, expect, it } from 'vitest';
import { BinaryExpr, type EvalStepSink, GroupExpr, LiteralExpr } from './ast';

class RecordingSink implements EvalStepSink {
  readonly recordedValues = new Map<string, bigint>();
  readonly binaryEvents: string[] = [];

  recordValue(nodeId: string, value: bigint): void {
    this.recordedValues.set(nodeId, value);
  }

  onBinaryOp(node: BinaryExpr, leftValue: bigint, rightValue: bigint, result: bigint): void {
    this.binaryEvents.push(`${node.id}:${leftValue}${node.operator}${rightValue}=${result}`);
  }
}

describe('day18 polymorphic AST nodes', () => {
  it('supports LiteralExpr, GroupExpr, and BinaryExpr getters, formatting, and evaluation', () => {
    const two = new LiteralExpr('n0', 2n);
    const three = new LiteralExpr('n1', 3n);
    const add = new BinaryExpr('n2', '+', two, three);
    const grouped = new GroupExpr('n3', add);
    const four = new LiteralExpr('n4', 4n);
    const mul = new BinaryExpr('n5', '*', grouped, four);

    expect(Object.isFrozen(two)).toBe(true);
    expect(Object.isFrozen(grouped)).toBe(true);
    expect(Object.isFrozen(mul)).toBe(true);

    expect(two.nodeKind).toBe('literal');
    expect(two.label).toBe('2');
    expect(two.children).toEqual([]);
    expect(two.binaryOpCount).toBe(0);
    expect(two.format()).toBe('2');
    expect(two.evaluate()).toBe(2n);

    expect(grouped.nodeKind).toBe('group');
    expect(grouped.label).toBe('( )');
    expect(grouped.children).toEqual([add]);
    expect(grouped.binaryOpCount).toBe(1);
    expect(grouped.format()).toBe('(2 + 3)');
    expect(grouped.evaluate()).toBe(5n);

    expect(mul.nodeKind).toBe('binary');
    expect(mul.label).toBe('*');
    expect(mul.children).toEqual([grouped, four]);
    expect(mul.binaryOpCount).toBe(2);
    expect(mul.format()).toBe('(2 + 3) * 4');
    expect(mul.evaluate()).toBe(20n);
  });

  it('collects post-order step values and binary operation events into an EvalStepSink', () => {
    const root = new BinaryExpr(
      'n4',
      '*',
      new GroupExpr('n3', new BinaryExpr('n2', '+', new LiteralExpr('n0', 2n), new LiteralExpr('n1', 3n))),
      new LiteralExpr('n5', 4n),
    );
    const sink = new RecordingSink();
    const total = root.collectSteps(sink);

    expect(total).toBe(20n);
    expect(sink.binaryEvents).toEqual(['n2:2+3=5', 'n4:5*4=20']);
    expect(Object.fromEntries(sink.recordedValues)).toEqual({
      n0: 2n,
      n1: 3n,
      n2: 5n,
      n3: 5n,
      n5: 4n,
      n4: 20n,
    });
  });
});
