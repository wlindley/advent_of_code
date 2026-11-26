import { describe, expect, it } from 'vitest';
import { solver } from './index';

function oracleHashBigInt(label: string): number {
  let acc = 0n;
  for (let i = 0; i < label.length; i += 1) {
    acc = (acc + BigInt(label.charCodeAt(i))) * 17n;
  }
  return Number(acc % 256n);
}

function oracleSolveHashmap(raw: string): number {
  const boxes: Array<Array<{ label: string; focal: number }>> = Array.from(
    { length: 256 },
    () => [],
  );
  const tokens = raw.replace(/[\r\n]+/g, '').split(',');
  for (const token of tokens) {
    if (token.endsWith('-')) {
      const label = token.slice(0, -1);
      const box = boxes[oracleHashBigInt(label)]!;
      const idx = box.findIndex((entry) => entry.label === label);
      if (idx !== -1) box.splice(idx, 1);
    } else {
      const [label, focalText] = token.split('=');
      const focal = Number(focalText);
      const box = boxes[oracleHashBigInt(label!)]!;
      const idx = box.findIndex((entry) => entry.label === label);
      if (idx !== -1) {
        box[idx]!.focal = focal;
      } else {
        box.push({ label: label!, focal });
      }
    }
  }
  let total = 0;
  for (let b = 0; b < 256; b += 1) {
    const box = boxes[b]!;
    for (let s = 0; s < box.length; s += 1) {
      total += (b + 1) * (s + 1) * box[s]!.focal;
    }
  }
  return total;
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe('solver differential oracle', () => {
  it('matches oracle on the official 11-step example', () => {
    const raw = 'rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7';
    expect(solver.solve(solver.parse(raw))).toBe(oracleSolveHashmap(raw));
  });

  it('matches oracle under heavy single-box collision churn (box 3)', () => {
    // 'pc', 'ot', 'ab' all hash to box 3.
    const raw = 'pc=4,ot=9,ab=5,ot-,pc=6,ot=7,ab=1,pc-,ab=9,pc=2,ot-,ab-';
    expect(solver.solve(solver.parse(raw))).toBe(oracleSolveHashmap(raw));
  });

  it('matches oracle across 120 seeded random instruction sequences', () => {
    const labels = ['rn', 'cm', 'qp', 'pc', 'ot', 'ab', 'sl', 'xy', 'Az', 'Bb'];
    const rand = createRng(20231502);
    for (let trial = 0; trial < 120; trial += 1) {
      const length = 5 + Math.floor(rand() * 45);
      const tokens: string[] = [];
      for (let i = 0; i < length; i += 1) {
        const label = labels[Math.floor(rand() * labels.length)]!;
        if (rand() < 0.35) {
          tokens.push(`${label}-`);
        } else {
          const focal = 1 + Math.floor(rand() * 9);
          tokens.push(`${label}=${focal}`);
        }
      }
      const raw = tokens.join(',');
      expect(solver.solve(solver.parse(raw))).toBe(oracleSolveHashmap(raw));
    }
  });
});
