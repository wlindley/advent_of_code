import { describe, expect, it } from 'vitest';
import {
  EVALUATE_EXPRESSION_POLICY,
  PacketSolver,
  VERSION_SUM_POLICY,
} from './index';

interface OracleResult {
  readonly next: number;
  readonly versionSum: number;
  readonly value: bigint;
}

function hexToBitsOracle(hex: string): string {
  let out = '';
  for (const ch of hex.trim()) {
    out += Number.parseInt(ch, 16).toString(2).padStart(4, '0');
  }
  return out;
}

function evalOracleOp(typeId: number, vals: readonly bigint[]): bigint {
  if (typeId === 0) return vals.reduce((a, b) => a + b, 0n);
  if (typeId === 1) return vals.reduce((a, b) => a * b, 1n);
  if (typeId === 2) return vals.reduce((a, b) => (b < a ? b : a));
  if (typeId === 3) return vals.reduce((a, b) => (b > a ? b : a));
  if (typeId === 5) return vals[0]! > vals[1]! ? 1n : 0n;
  if (typeId === 6) return vals[0]! < vals[1]! ? 1n : 0n;
  return vals[0]! === vals[1]! ? 1n : 0n;
}

function parseOraclePacket(bits: string, offset: number): OracleResult {
  const version = Number.parseInt(bits.slice(offset, offset + 3), 2);
  const typeId = Number.parseInt(bits.slice(offset + 3, offset + 6), 2);
  let cursor = offset + 6;
  if (typeId === 4) {
    let val = 0n;
    while (true) {
      const grp = bits.slice(cursor, cursor + 5);
      cursor += 5;
      val = (val << 4n) | BigInt(Number.parseInt(grp.slice(1), 2));
      if (grp[0] === '0') return { next: cursor, versionSum: version, value: val };
    }
  }
  const lenType = bits[cursor];
  cursor += 1;
  let versionSum = version;
  const childVals: bigint[] = [];
  if (lenType === '0') {
    const endBit = cursor + 15 + Number.parseInt(bits.slice(cursor, cursor + 15), 2);
    cursor += 15;
    while (cursor < endBit) {
      const child = parseOraclePacket(bits, cursor);
      cursor = child.next;
      versionSum += child.versionSum;
      childVals.push(child.value);
    }
  } else {
    const count = Number.parseInt(bits.slice(cursor, cursor + 11), 2);
    cursor += 11;
    for (let i = 0; i < count; i += 1) {
      const child = parseOraclePacket(bits, cursor);
      cursor = child.next;
      versionSum += child.versionSum;
      childVals.push(child.value);
    }
  }
  return { next: cursor, versionSum, value: evalOracleOp(typeId, childVals) };
}

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state;
  };
}

function generatePacketBits(rng: () => number, depth: number, maxDepth: number): string {
  const version = (rng() & 7).toString(2).padStart(3, '0');
  const opTypes = [0, 1, 2, 3, 5, 6, 7];
  const isLiteral = depth >= maxDepth || (depth > 0 && (rng() & 3) === 0);
  if (isLiteral) {
    const groups = 1 + (rng() % 14);
    let body = '';
    for (let g = 0; g < groups; g += 1) {
      const prefix = g + 1 === groups ? '0' : '1';
      body += prefix + (rng() & 15).toString(2).padStart(4, '0');
    }
    return `${version}100${body}`;
  }
  const typeId = opTypes[rng() % opTypes.length]!;
  const childCount = typeId >= 5 ? 2 : 1 + (rng() % 3);
  let childrenBits = '';
  for (let i = 0; i < childCount; i += 1) {
    childrenBits += generatePacketBits(rng, depth + 1, maxDepth);
  }
  const lenMode = rng() & 1;
  const lenHeader =
    lenMode === 0
      ? `0${childrenBits.length.toString(2).padStart(15, '0')}`
      : `1${childCount.toString(2).padStart(11, '0')}`;
  return `${version}${typeId.toString(2).padStart(3, '0')}${lenHeader}${childrenBits}`;
}

function bitsToHexOracle(bits: string): string {
  const paddedLen = Math.ceil(bits.length / 4) * 4;
  const padded = bits.padEnd(paddedLen, '0');
  let hex = '';
  for (let i = 0; i < padded.length; i += 4) {
    hex += Number.parseInt(padded.slice(i, i + 4), 2).toString(16).toUpperCase();
  }
  return hex;
}

describe('PacketSolver independent oracle cross-check', () => {
  const vSolver = new PacketSolver(VERSION_SUM_POLICY);
  const eSolver = new PacketSolver(EVALUATE_EXPRESSION_POLICY);

  it('matches the independent binary-string oracle across all official examples', () => {
    const examples = [
      'D2FE28', '38006F45291200', 'EE00D40C823060',
      '8A004A801A8002F478', '620080001611562C8802118E34',
      'C0015000016115A2E0802F182340', 'A0016C880162017C3686B18A3D4780',
      'C200B40A82', '04005AC33890', '880086C3E88112', 'CE00C43D881120',
      'D8005AC2A8F0', 'F600BC2D8F', '9C005AC2F8F0', '9C0141080250320F1802104A08',
    ];
    for (const hex of examples) {
      const oracle = parseOraclePacket(hexToBitsOracle(hex), 0);
      const stream = vSolver.parse(hex);
      expect(vSolver.solve(stream)).toBe(BigInt(oracle.versionSum));
      expect(eSolver.solve(stream)).toBe(oracle.value);
    }
  });

  it('matches oracle across 30 deterministic PRNG trees (depths 0..5, >60-bit literals, all type IDs)', () => {
    const rng = createPrng(20211216);
    for (let i = 0; i < 30; i += 1) {
      const hex = bitsToHexOracle(generatePacketBits(rng, 0, i % 6));
      const oracle = parseOraclePacket(hexToBitsOracle(hex), 0);
      const stream = vSolver.parse(hex);
      expect(vSolver.solve(stream)).toBe(BigInt(oracle.versionSum));
      expect(eSolver.solve(stream)).toBe(oracle.value);
    }
  });

  it('exposes formatAnswer and trace with or without options on PacketSolver', () => {
    const stream = vSolver.parse('A0016C880162017C3686B18A3D4780');
    expect(vSolver.formatAnswer(vSolver.solve(stream))).toBe('31');
    const defaultFrames = vSolver.trace(stream);
    const cappedFrames = vSolver.trace(stream, { maxSteps: 6 });
    expect(defaultFrames[defaultFrames.length - 1]!.activeResult).toBe(31n);
    expect(cappedFrames).toHaveLength(6);
  });
});
