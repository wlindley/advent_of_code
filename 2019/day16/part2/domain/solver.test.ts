import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_TRACE_STEPS, extractFrameMessage } from '../../shared';
import { solver } from './index';

const C5: ReadonlyArray<readonly number[]> = [
  [1],
  [1, 1],
  [1, 2, 1],
  [1, 3, 3, 1],
  [1, 4, 1, 4, 1],
];

function lucasBinomialMod10(n: number, k: number): number {
  const r2 = (n & k) === k ? 1 : 0;
  let r5 = 1;
  let nn = n;
  let kk = k;
  while (nn > 0 || kk > 0) {
    const ni = nn % 5;
    const ki = kk % 5;
    if (ki > ni) {
      r5 = 0;
      break;
    }
    r5 = (r5 * C5[ni]![ki]!) % 5;
    nn = Math.floor(nn / 5);
    kk = Math.floor(kk / 5);
  }
  return r5 % 2 === r2 ? r5 : r5 + 5;
}

function lucasPart2Oracle(raw: string, phases = 100): string {
  const s = raw.trim();
  const n = s.length;
  const totalLen = n * 10_000;
  const offset = Number(s.slice(0, 7));
  const maxLen = totalLen - offset;
  const out = [0, 0, 0, 0, 0, 0, 0, 0];
  const digits = Array.from(s, (ch) => Number(ch));
  for (let j = 0; j < maxLen; j += 1) {
    const coeff = lucasBinomialMod10(j + phases - 1, phases - 1);
    if (coeff === 0) continue;
    const limit = Math.min(8, maxLen - j);
    for (let d = 0; d < limit; d += 1) {
      out[d] = (out[d]! + coeff * digits[(offset + d + j) % n]!) % 10;
    }
  }
  return out.join('');
}

function nextLcg(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function makeSyntheticInput(length: number, seed: number): string {
  const total = length * 10_000;
  const minOff = Math.floor(0.85 * total);
  const maxOff = total - 8;
  let rng = nextLcg(seed);
  const offset = minOff + (rng % (maxOff - minOff + 1));
  const prefix = String(offset).padStart(7, '0');
  let rest = '';
  for (let i = 7; i < length; i += 1) {
    rng = nextLcg(rng);
    rest += String(rng % 10);
  }
  return prefix + rest;
}

describe('2019 Day 16 Part 2 domain solver', () => {
  it('exposes the offset-message policy and solves all official Part 2 examples with Lucas parity', () => {
    expect(solver.policy.id).toBe('offset-message');
    const cases: ReadonlyArray<readonly [string, string]> = [
      ['03036732577212944063491565474664', '84462026'],
      ['02935109699940807407585447034323', '78725270'],
      ['03081770884921959731165446850517', '53553731'],
    ];
    for (const [raw, expected] of cases) {
      const signal = solver.parse(`  ${raw}\n`);
      expect(solver.solve(signal)).toBe(expected);
      expect(lucasPart2Oracle(raw)).toBe(expected);
    }
  });

  it('handles leading-zero output and exact upper boundary (offset + 8 === L)', () => {
    const raw = '014999200000001';
    const signal = solver.parse(raw);
    expect(solver.solve(signal)).toBe('00050001');
    expect(lucasPart2Oracle(raw)).toBe('00050001');
    const frames = solver.trace(signal, { maxSteps: 2 });
    expect(frames[frames.length - 1]!.previewDigits).toHaveLength(8);
    expect(extractFrameMessage(frames[frames.length - 1]!)).toBe('00050001');
  });

  it('handles exact lower boundary (offset === L / 2) with Lucas-CRT parity', () => {
    const raw = '0050000001';
    const signal = solver.parse(raw);
    expect(solver.solve(signal)).toBe(lucasPart2Oracle(raw));
  });

  it('matches Lucas-CRT oracle on 5 seeded PRNG synthetic repeated signals', () => {
    const lengths = [11, 17, 23, 29, 37];
    for (let i = 0; i < lengths.length; i += 1) {
      const raw = makeSyntheticInput(lengths[i]!, 1000 + i * 97);
      const signal = solver.parse(raw);
      expect(solver.solve(signal)).toBe(lucasPart2Oracle(raw));
    }
  });

  it('produces bounded tail trace frames for default and explicit maxSteps', () => {
    const signal = solver.parse('03036732577212944063491565474664');
    const defFrames = solver.trace(signal);
    expect(defFrames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(defFrames[0]!.mode).toBe('tail');
    expect(defFrames[0]!.windowOffset).toBe(303673);
    expect(extractFrameMessage(defFrames[defFrames.length - 1]!)).toBe('84462026');

    const sixFrames = solver.trace(signal, { maxSteps: 6 });
    expect(sixFrames).toHaveLength(6);
    expect(extractFrameMessage(sixFrames[5]!)).toBe('84462026');

    const oneFrame = solver.trace(signal, { maxSteps: 1 });
    expect(oneFrame).toHaveLength(1);
    expect(oneFrame[0]!.phase).toBe(100);
    expect(extractFrameMessage(oneFrame[0]!)).toBe('84462026');
  });

  it('rejects empty, whitespace, non-digit, and short inputs', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('   \n')).toThrow();
    expect(() => solver.parse('0303673x')).toThrow();
    expect(() => solver.solve(solver.parse('123456'))).toThrow();
  });

  it('rejects out-of-bounds offsets (< L/2, offset + 8 > L, >= L) and invalid maxSteps', () => {
    expect(() => solver.solve(solver.parse('0049999000'))).toThrow();
    expect(() => solver.solve(solver.parse('014999300000001'))).toThrow();
    expect(() => solver.solve(solver.parse('9999999'))).toThrow();

    const valid = solver.parse('03036732577212944063491565474664');
    expect(() => solver.trace(valid, { maxSteps: 0 })).toThrow();
    expect(() => solver.trace(valid, { maxSteps: -1 })).toThrow();
    expect(() => solver.trace(valid, { maxSteps: 1.5 })).toThrow();
  });
});
