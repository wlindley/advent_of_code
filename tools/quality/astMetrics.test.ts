import { describe, expect, it } from 'vitest';
import { analyzeSourceFile } from './astMetrics';

describe('analyzeSourceFile', () => {
  it('ignores blank lines and comments and handles empty files', () => {
    const empty = analyzeSourceFile('empty.ts', '\n// comment only\n/* block */\n');
    expect(empty.sloc).toBe(0);
    expect(empty.functionCount).toBe(0);
    expect(empty.halsteadVolume).toBe(0);
    expect(empty.maintainabilityIndex).toBe(100);
  });

  it('computes McCabe cyclomatic complexity, nesting depth, and MI accurately', () => {
    const code = `
      // header comment
      export function classify(x: number, y: number | null): string {
        if (x > 0 && (y ?? 0) > 0) {
          for (let i = 0; i < x; i++) {
            if (i === 2) return 'two';
          }
          return x > 5 ? 'big' : 'small';
        } else if (x < 0 || y === null) {
          return 'neg';
        }
        return 'zero';
      }

      export const helper = (v: number) => v + 1;
    `;
    const result = analyzeSourceFile('sample.ts', code);
    expect(result.functionCount).toBe(2);
    // classify: base 1 + if + && + ?? + for + if + ?: + else if + || = 9; helper: base 1
    expect(result.totalCyclomatic).toBe(10);
    expect(result.maxCyclomatic).toBe(9);
    // if -> for -> if = depth 3 (else-if does not add extra depth)
    expect(result.maxNestingDepth).toBe(3);
    expect(result.sloc).toBeGreaterThan(10);
    expect(result.halsteadVolume).toBeGreaterThan(0);
    expect(result.maintainabilityIndex).toBeGreaterThan(0);
    expect(result.maintainabilityIndex).toBeLessThanOrEqual(100);
  });

  it('parses TSX, classes, accessors, and isolates nested functions', () => {
    const tsx = `
      export class Box {
        private v: number;
        constructor(v: number) { this.v = v; }
        get value() { return this.v; }
        set value(n: number) { this.v = n; }
        render() {
          const inner = function (flag: boolean) {
            return flag ? <span>ok</span> : <span>no</span>;
          };
          return inner(true);
        }
      }
    `;
    const result = analyzeSourceFile('Box.tsx', tsx);
    expect(result.functionCount).toBe(5);
    // inner has cyclomatic 2 (ternary), all others have 1 -> total 6, max 2
    expect(result.totalCyclomatic).toBe(6);
    expect(result.maxCyclomatic).toBe(2);
    expect(result.maxNestingDepth).toBe(0);
  });
});
