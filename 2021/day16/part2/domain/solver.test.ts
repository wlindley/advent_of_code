import { describe, expect, it } from 'vitest';
import { EVALUATE_EXPRESSION_POLICY } from '../../shared';
import { solver } from './index';

type BitReader = { readonly bits: string; pos: number };
type OpId = 0 | 1 | 2 | 3 | 5 | 6 | 7;
type SynthAst =
  | { readonly kind: 'lit'; readonly ver: number; readonly val: bigint }
  | { readonly kind: 'op'; readonly ver: number; readonly typeId: OpId; readonly mode: 0 | 1; readonly children: readonly SynthAst[] };

const OP_IDS: readonly OpId[] = [0, 1, 2, 3, 5, 6, 7];

function readBits(reader: BitReader, count: number): number {
  const value = Number.parseInt(reader.bits.slice(reader.pos, reader.pos + count), 2);
  reader.pos += count;
  return value;
}

function oracleLiteral(reader: BitReader): bigint {
  let acc = 0n;
  let cont = 1;
  while (cont === 1) { cont = readBits(reader, 1); acc = (acc << 4n) | BigInt(readBits(reader, 4)); }
  return acc;
}

function oracleReduce(typeId: number, args: readonly bigint[]): bigint {
  let acc = typeId === 0 ? 0n : typeId === 1 ? 1n : args[0]!;
  if (typeId === 0) { for (const v of args) acc += v; return acc; }
  if (typeId === 1) { for (const v of args) acc *= v; return acc; }
  if (typeId === 2) { for (const v of args) if (v < acc) acc = v; return acc; }
  if (typeId === 3) { for (const v of args) if (v > acc) acc = v; return acc; }
  if (typeId === 5) return args[0]! > args[1]! ? 1n : 0n;
  if (typeId === 6) return args[0]! < args[1]! ? 1n : 0n;
  return args[0]! === args[1]! ? 1n : 0n;
}

function oraclePacket(reader: BitReader): bigint {
  readBits(reader, 3);
  const typeId = readBits(reader, 3);
  if (typeId === 4) return oracleLiteral(reader);
  const args: bigint[] = [];
  if (readBits(reader, 1) === 0) {
    const subLen = readBits(reader, 15);
    const end = reader.pos + subLen;
    while (reader.pos < end) args.push(oraclePacket(reader));
  } else {
    const count = readBits(reader, 11);
    for (let i = 0; i < count; i += 1) args.push(oraclePacket(reader));
  }
  return oracleReduce(typeId, args);
}

function oracleEval(hex: string): bigint {
  let bits = '';
  for (const ch of hex) bits += Number.parseInt(ch, 16).toString(2).padStart(4, '0');
  return oraclePacket({ bits, pos: 0 });
}

function encodeLiteralBits(val: bigint): string {
  const nibbles: string[] = [];
  let v = val;
  do { nibbles.push((v & 0xfn).toString(2).padStart(4, '0')); v >>= 4n; } while (v > 0n);
  nibbles.reverse();
  let out = '';
  for (let i = 0; i < nibbles.length; i += 1) out += (i < nibbles.length - 1 ? '1' : '0') + nibbles[i]!;
  return out;
}

function encodeAstBits(node: SynthAst): string {
  const hdr = node.ver.toString(2).padStart(3, '0') + (node.kind === 'lit' ? 4 : node.typeId).toString(2).padStart(3, '0');
  if (node.kind === 'lit') return hdr + encodeLiteralBits(node.val);
  let body = '';
  for (const child of node.children) body += encodeAstBits(child);
  const lenField = node.mode === 0 ? body.length.toString(2).padStart(15, '0') : node.children.length.toString(2).padStart(11, '0');
  return hdr + String(node.mode) + lenField + body;
}

function encodeAstHex(node: SynthAst): string {
  const bits = encodeAstBits(node);
  const padded = bits.length % 4 === 0 ? bits : bits + '0'.repeat(4 - (bits.length % 4));
  let hex = '';
  for (let i = 0; i < padded.length; i += 4) hex += Number.parseInt(padded.slice(i, i + 4), 2).toString(16).toUpperCase();
  return hex;
}

function nextUint32(rng: { state: number }): number {
  rng.state = (Math.imul(rng.state, 1664525) + 1013904223) >>> 0;
  return rng.state;
}

function randomAst(rng: { state: number }, depth: number, maxDepth: number): { ast: SynthAst; val: bigint } {
  const ver = nextUint32(rng) % 8;
  if (depth >= maxDepth || (depth > 0 && nextUint32(rng) % 3 === 0)) {
    const pick = nextUint32(rng) % 4;
    const val = pick === 0 ? 0n : pick === 1 ? BigInt(nextUint32(rng) % 97) : (1n << BigInt(64 + (nextUint32(rng) % 12))) + BigInt(nextUint32(rng));
    return { ast: { kind: 'lit', ver, val }, val };
  }
  const typeId = OP_IDS[nextUint32(rng) % OP_IDS.length]!;
  const mode = (nextUint32(rng) % 2) as 0 | 1;
  const count = typeId >= 5 ? 2 : 1 + (nextUint32(rng) % 3);
  const children: SynthAst[] = [];
  const childVals: bigint[] = [];
  for (let i = 0; i < count; i += 1) {
    const sub = randomAst(rng, depth + 1, maxDepth);
    children.push(sub.ast);
    childVals.push(sub.val);
  }
  return { ast: { kind: 'op', ver, typeId, mode, children }, val: oracleReduce(typeId, childVals) };
}

function lit(val: bigint, ver: number): SynthAst { return { kind: 'lit', ver, val }; }
function op(typeId: OpId, mode: 0 | 1, children: readonly SynthAst[], ver: number): SynthAst { return { kind: 'op', ver, typeId, mode, children }; }

describe('2021 Day 16 Part 2 solver', () => {
  it('solves all 8 official Part 2 examples matching EVALUATE_EXPRESSION_POLICY and oracle', () => {
    expect(solver.policy).toBe(EVALUATE_EXPRESSION_POLICY);
    const cases: readonly [string, bigint][] = [
      ['C200B40A82', 3n], ['04005AC33890', 54n], ['880086C3E88112', 7n], ['CE00C43D881120', 9n],
      ['D8005AC2A8F0', 1n], ['F600BC2D8F', 0n], ['9C005AC2F8F0', 0n], ['9C0141080250320F1802104A08', 1n],
    ];
    for (const [hex, expected] of cases) {
      const answer = solver.solve(solver.parse(hex));
      expect(answer).toBe(expected);
      expect(solver.formatAnswer(answer)).toBe(expected.toString());
      expect(oracleEval(hex)).toBe(expected);
    }
  });

  it('preserves > 2^64 BigInt precision, 0n literals, and single-child variadics', () => {
    const big = (1n << 68n) + 123456789n;
    const cases: readonly [SynthAst, bigint][] = [
      [lit(big, 3), big], [lit(0n, 1), 0n],
      [op(0, 0, [lit(big, 1), lit(big + 1n, 2)], 0), big + big + 1n],
      [op(1, 1, [lit(big, 1), lit(big + 1n, 2)], 0), big * (big + 1n)],
      [op(1, 0, [lit(big, 1), lit(0n, 2), lit(7n, 3)], 0), 0n],
      [op(5, 0, [lit(big + 1n, 1), lit(big, 2)], 0), 1n],
      [op(6, 1, [lit(big, 1), lit(big + 1n, 2)], 0), 1n],
      [op(7, 0, [lit(big, 1), lit(big + 1n, 2)], 0), 0n],
      [op(7, 1, [lit(big, 1), lit(big, 2)], 0), 1n],
      [op(0, 0, [lit(big, 1)], 2), big], [op(1, 1, [lit(big, 1)], 2), big],
      [op(2, 0, [lit(big, 1)], 2), big], [op(3, 1, [lit(big, 1)], 2), big],
    ];
    for (const [ast, expected] of cases) {
      const hex = encodeAstHex(ast);
      expect(solver.solve(solver.parse(hex))).toBe(expected);
      expect(oracleEval(hex)).toBe(expected);
    }
  });

  it('matches independent oracle across 20 seeded random AST round-trips', () => {
    const rng = { state: 20211602 };
    for (let i = 0; i < 20; i += 1) {
      const { ast, val } = randomAst(rng, 0, 1 + (i % 4));
      const hex = encodeAstHex(ast);
      expect(solver.solve(solver.parse(hex))).toBe(val);
      expect(oracleEval(hex)).toBe(val);
    }
  });

  it('produces bounded decode and reduce trace frames ending at 1n', () => {
    const frames = solver.trace(solver.parse('9C0141080250320F1802104A08'), { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]!.phase).toBe('decode');
    expect(frames[9]!.phase).toBe('reduce');
    expect(frames[9]!.activeResult).toBe(1n);
    expect(frames[9]!.isComplete).toBe(true);
  });

  it('throws RangeError on 3-child or 1-child comparison packets while analyze succeeds', () => {
    for (const bad of [op(5, 0, [lit(1n, 0), lit(2n, 0), lit(3n, 0)], 0), op(6, 1, [lit(1n, 0)], 0)]) {
      const stream = solver.parse(encodeAstHex(bad));
      expect(solver.analyze(stream).root.kind).toBe('operator');
      expect(() => solver.solve(stream)).toThrow(RangeError);
      expect(() => solver.trace(stream)).toThrow(RangeError);
    }
  });

  it('rejects malformed hex, truncated literals, and non-zero trailing padding', () => {
    expect(() => solver.parse('G0')).toThrow(SyntaxError);
    expect(() => solver.analyze(solver.parse('D2FE'))).toThrow(SyntaxError);
    expect(() => solver.analyze(solver.parse('D2FE2F'))).toThrow(SyntaxError);
  });
});
