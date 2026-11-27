import { describe, expect, it } from 'vitest';
import { MAX_FLOATING_BITS, MAX_PREVIEW_WRITES, WORD_MASK } from '../../shared';
import { solver } from './solver';

const OFFICIAL_PART2_EXAMPLE = [
  'mask = 000000000000000000000000000000X1001X',
  'mem[42] = 100',
  'mask = 00000000000000000000000000000000X0XX',
  'mem[26] = 1',
].join('\n');

class SeededRng {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
  nextUint36(): bigint {
    return (BigInt(this.nextInt(1 << 18)) << 18n) | BigInt(this.nextInt(1 << 18));
  }
}

function applyAddressMaskStr(mask: string, address: bigint): string {
  const bits = address.toString(2).padStart(36, '0');
  let out = '';
  for (let i = 0; i < 36; i += 1) {
    const m = mask.charAt(i);
    out += m === '0' ? bits.charAt(i) : m;
  }
  return out;
}

function expandFloatingStrings(masked: string): bigint[] {
  let current = [''];
  for (let i = 0; i < masked.length; i += 1) {
    const ch = masked.charAt(i);
    const next: string[] = [];
    for (const prefix of current) {
      if (ch === 'X') next.push(`${prefix}0`, `${prefix}1`);
      else next.push(prefix + ch);
    }
    current = next;
  }
  const result: bigint[] = [];
  for (const bits of current) result.push(BigInt(`0b${bits}`));
  return result;
}

function oracleSolvePart2(raw: string): bigint {
  const mem = new Map<bigint, bigint>();
  let activeMask = '';
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    if (line.startsWith('mask = ')) {
      activeMask = line.slice(7);
      continue;
    }
    const [, addrStr, valStr] = /^mem\[(\d+)\] = (\d+)$/.exec(line)!;
    const val = BigInt(valStr!);
    for (const addr of expandFloatingStrings(applyAddressMaskStr(activeMask, BigInt(addrStr!)))) {
      if (val === 0n) mem.delete(addr);
      else mem.set(addr, val);
    }
  }
  let sum = 0n;
  for (const v of mem.values()) sum += v;
  return sum;
}

function randomMaskPattern(rng: SeededRng, floatingCount: number): string {
  const chars: string[] = [];
  for (let i = 0; i < 36; i += 1) chars.push(rng.nextInt(2) === 0 ? '0' : '1');
  for (let placed = 0; placed < floatingCount; ) {
    const idx = rng.nextInt(36);
    if (chars[idx] !== 'X') {
      chars[idx] = 'X';
      placed += 1;
    }
  }
  return chars.join('');
}

function generateRandomProgram(rng: SeededRng): string {
  const lines: string[] = [];
  const maskCount = 2 + rng.nextInt(3);
  const seen: bigint[] = [];
  for (let m = 0; m < maskCount; m += 1) {
    lines.push(`mask = ${randomMaskPattern(rng, rng.nextInt(6))}`);
    const writes = 2 + rng.nextInt(2);
    for (let w = 0; w < writes; w += 1) {
      const addr = seen.length > 0 && rng.nextInt(3) === 0 ? seen[rng.nextInt(seen.length)]! : rng.nextUint36();
      seen.push(addr);
      lines.push(`mem[${addr}] = ${rng.nextInt(4) === 0 ? 0n : rng.nextUint36()}`);
    }
  }
  return lines.join('\n');
}

describe('2020 Day 14 Part 2 solver', () => {
  it('solves the official Part 2 example to 208n and matches the reference oracle', () => {
    expect(solver.solve(solver.parse(OFFICIAL_PART2_EXAMPLE))).toBe(208n);
    expect(oracleSolvePart2(OFFICIAL_PART2_EXAMPLE)).toBe(208n);
  });

  it('handles boundary masks and 36-bit MSB bit-35 expansion semantics', () => {
    expect(solver.solve(solver.parse(`mask = ${'0'.repeat(36)}\nmem[${WORD_MASK}] = ${WORD_MASK}`))).toBe(WORD_MASK);
    expect(solver.solve(solver.parse(`mask = ${'1'.repeat(36)}\nmem[0] = 5\nmem[123] = 7`))).toBe(7n);
    const msbFloating = `mask = X${'0'.repeat(34)}1\nmem[0] = 7`;
    expect(solver.solve(solver.parse(msbFloating))).toBe(14n);
    expect(oracleSolvePart2(msbFloating)).toBe(14n);
  });

  it('handles overlapping overwrites and zero-clearing writes matching the oracle', () => {
    const raw = [`mask = ${'0'.repeat(34)}XX`, 'mem[0] = 50', `mask = ${'0'.repeat(35)}X`, 'mem[0] = 0', `mask = ${'0'.repeat(35)}0`, 'mem[2] = 9'].join('\n');
    expect(solver.solve(solver.parse(raw))).toBe(oracleSolvePart2(raw));
    expect(solver.solve(solver.parse(raw))).toBe(59n);
  });

  it('preserves exact BigInt sum above 2^53 without precision loss', () => {
    const raw = [`mask = ${'0'.repeat(19)}${'X'.repeat(17)}`, `mem[0] = ${WORD_MASK}`, `mask = ${'0'.repeat(18)}1${'0'.repeat(17)}`, `mem[0] = ${WORD_MASK}`].join('\n');
    const sum = solver.solve(solver.parse(raw));
    expect(sum).toBe(131073n * WORD_MASK);
    expect(sum > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(BigInt(Number(sum)) !== sum).toBe(true);
  });

  it('enforces the MAX_FLOATING_BITS guardrail only on executed writes', () => {
    const tooManyX = `${'0'.repeat(36 - (MAX_FLOATING_BITS + 1))}${'X'.repeat(MAX_FLOATING_BITS + 1)}`;
    const executed = solver.parse(`mask = ${tooManyX}\nmem[1] = 2`);
    expect(() => solver.solve(executed)).toThrow(RangeError);
    expect(() => solver.trace(executed)).toThrow(RangeError);
    expect(solver.solve(solver.parse(`mask = ${tooManyX}\nmask = ${'0'.repeat(36)}\nmem[1] = 42`))).toBe(42n);
  });

  it('matches the reference oracle across 25 seeded PRNG programs', () => {
    const rng = new SeededRng(20201402);
    for (let i = 0; i < 25; i += 1) {
      const raw = generateRandomProgram(rng);
      expect(solver.solve(solver.parse(raw))).toBe(oracleSolvePart2(raw));
    }
  });

  it('captures Part 2 trace previews, truncation, step sampling, and input errors', () => {
    const full = solver.trace(solver.parse(OFFICIAL_PART2_EXAMPLE));
    expect(full).toHaveLength(4);
    expect(full[1]!.policyId).toBe('decoder-v2');
    expect(full[1]!.writesInStep).toBe(4);
    expect(full[3]!.writesInStep).toBe(8);
    expect(full[3]!.writePreview[6]).toEqual({ address: 26n, previousValue: 100n, value: 1n });
    expect(full[3]!.memorySum).toBe(208n);
    expect(full[3]!.nonZeroCount).toBe(10);

    const fourX = solver.trace(solver.parse(`mask = ${'0'.repeat(32)}XXXX\nmem[0] = 3`));
    expect(fourX[1]!.writesInStep).toBe(16);
    expect(fourX[1]!.writePreview).toHaveLength(MAX_PREVIEW_WRITES);
    expect(fourX[1]!.truncatedWriteCount).toBe(8);

    const bounded = solver.trace(solver.parse(OFFICIAL_PART2_EXAMPLE), { maxSteps: 2 });
    expect(bounded).toHaveLength(2);
    expect(bounded[1]!.memorySum).toBe(208n);
    expect(() => solver.trace(solver.parse(OFFICIAL_PART2_EXAMPLE), { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('mem[1] = 2')).toThrow(Error);
  });
});
