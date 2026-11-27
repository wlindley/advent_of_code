import type { LiteralPacket, OperatorPacket, OperatorTypeId, Packet } from './packet';

export interface OperatorSpec {
  readonly name: string;
  readonly symbol: string;
  readonly evaluate: (values: readonly bigint[]) => bigint;
}

function requireNonEmpty(values: readonly bigint[], opName: string): readonly bigint[] {
  if (values.length === 0) {
    throw new RangeError(`${opName} operator requires at least one operand`);
  }
  return values;
}

function requirePair(values: readonly bigint[], opName: string): readonly [bigint, bigint] {
  if (values.length !== 2) {
    throw new RangeError(`${opName} operator requires exactly 2 operands, got ${values.length}`);
  }
  return [values[0]!, values[1]!];
}

function sumValues(values: readonly bigint[]): bigint {
  let acc = 0n;
  for (const v of requireNonEmpty(values, 'sum')) acc += v;
  return acc;
}

function productValues(values: readonly bigint[]): bigint {
  let acc = 1n;
  for (const v of requireNonEmpty(values, 'product')) acc *= v;
  return acc;
}

function minValues(values: readonly bigint[]): bigint {
  const list = requireNonEmpty(values, 'minimum');
  let best = list[0]!;
  for (let i = 1; i < list.length; i += 1) {
    if (list[i]! < best) best = list[i]!;
  }
  return best;
}

function maxValues(values: readonly bigint[]): bigint {
  const list = requireNonEmpty(values, 'maximum');
  let best = list[0]!;
  for (let i = 1; i < list.length; i += 1) {
    if (list[i]! > best) best = list[i]!;
  }
  return best;
}

function greaterThanPair(values: readonly bigint[]): bigint {
  const [a, b] = requirePair(values, 'greater-than');
  return a > b ? 1n : 0n;
}

function lessThanPair(values: readonly bigint[]): bigint {
  const [a, b] = requirePair(values, 'less-than');
  return a < b ? 1n : 0n;
}

function equalPair(values: readonly bigint[]): bigint {
  const [a, b] = requirePair(values, 'equal-to');
  return a === b ? 1n : 0n;
}

/** Frozen operator specification lookup table indexed by BITS operator type ID. */
export const OPERATOR_SPECS: Readonly<Record<OperatorTypeId, OperatorSpec>> = Object.freeze({
  0: Object.freeze({ name: 'sum', symbol: '+', evaluate: sumValues }),
  1: Object.freeze({ name: 'product', symbol: '*', evaluate: productValues }),
  2: Object.freeze({ name: 'minimum', symbol: 'min', evaluate: minValues }),
  3: Object.freeze({ name: 'maximum', symbol: 'max', evaluate: maxValues }),
  5: Object.freeze({ name: 'greater-than', symbol: '>', evaluate: greaterThanPair }),
  6: Object.freeze({ name: 'less-than', symbol: '<', evaluate: lessThanPair }),
  7: Object.freeze({ name: 'equal-to', symbol: '=', evaluate: equalPair }),
});

export type PacketPolicyMode = 'version-sum' | 'evaluate';

export interface PacketPolicyInit {
  readonly mode: PacketPolicyMode;
  readonly label: string;
  readonly reduceLiteral: (packet: LiteralPacket) => bigint;
  readonly reduceOperator: (packet: OperatorPacket, childValues: readonly bigint[]) => bigint;
}

/** Strategy object parameterizing recursive packet reduction for Part 1 and Part 2. */
export class PacketPolicy {
  readonly mode: PacketPolicyMode;
  readonly label: string;
  private readonly literalFn: (packet: LiteralPacket) => bigint;
  private readonly operatorFn: (packet: OperatorPacket, childValues: readonly bigint[]) => bigint;

  constructor(init: PacketPolicyInit) {
    this.mode = init.mode;
    this.label = init.label;
    this.literalFn = init.reduceLiteral;
    this.operatorFn = init.reduceOperator;
    Object.freeze(this);
  }

  reduceLiteral(packet: LiteralPacket): bigint {
    return this.literalFn(packet);
  }

  reduceOperator(packet: OperatorPacket, childValues: readonly bigint[]): bigint {
    return this.operatorFn(packet, childValues);
  }

  compute(root: Packet): bigint {
    if (root.kind === 'literal') {
      return this.reduceLiteral(root);
    }
    const childValues: bigint[] = [];
    for (const child of root.children) {
      childValues.push(this.compute(child));
    }
    return this.reduceOperator(root, childValues);
  }
}

function reduceVersionSumLiteral(packet: LiteralPacket): bigint {
  return BigInt(packet.version);
}

function reduceVersionSumOperator(packet: OperatorPacket, childValues: readonly bigint[]): bigint {
  return BigInt(packet.version) + sumValues(childValues);
}

function reduceExpressionLiteral(packet: LiteralPacket): bigint {
  return packet.value;
}

function reduceExpressionOperator(packet: OperatorPacket, childValues: readonly bigint[]): bigint {
  return OPERATOR_SPECS[packet.typeId].evaluate(childValues);
}

/** Part 1 reduction policy: sums every packet's 3-bit version field. */
export const VERSION_SUM_POLICY = new PacketPolicy({
  mode: 'version-sum',
  label: 'Version Sum',
  reduceLiteral: reduceVersionSumLiteral,
  reduceOperator: reduceVersionSumOperator,
});

/** Part 2 reduction policy: evaluates the full BITS expression AST. */
export const EVALUATE_EXPRESSION_POLICY = new PacketPolicy({
  mode: 'evaluate',
  label: 'Evaluate Expression',
  reduceLiteral: reduceExpressionLiteral,
  reduceOperator: reduceExpressionOperator,
});

/** Evaluates a decoded BITS packet tree under Part 2 expression semantics. */
export function evaluatePacket(packet: Packet): bigint {
  return EVALUATE_EXPRESSION_POLICY.compute(packet);
}
