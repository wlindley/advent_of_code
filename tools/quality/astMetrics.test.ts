import { describe, expect, it } from 'vitest';
import { analyzeSourceFile } from './astMetrics';

describe('analyzeSourceFile', () => {
  it('ignores blank lines and comments and handles empty files', () => {
    const empty = analyzeSourceFile('empty.ts', '\n// comment only\n/* block */\n');
    expect(empty.sloc).toBe(0);
    expect(empty.functionCount).toBe(0);
    expect(empty.maxFunctionSloc).toBe(0);
    expect(empty.nestedFunctionCount).toBe(0);
    expect(empty.maxCyclomaticHotspot).toBeNull();
    expect(empty.maintainabilityIndex).toBe(100);
  });

  it('computes McCabe CC, nesting depth, function length, and hotspots accurately', () => {
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
    expect(result.totalCyclomatic).toBe(10);
    expect(result.maxCyclomatic).toBe(9);
    expect(result.maxNestingDepth).toBe(3);
    expect(result.nestedFunctionCount).toBe(0);
    expect(result.maxCyclomaticHotspot).toEqual({
      filePath: 'sample.ts',
      name: 'classify',
      startLine: 3,
      endLine: 13,
      value: 9,
    });
    expect(result.maxNestingHotspot?.name).toBe('classify');
    expect(result.longestFunctionHotspot?.value).toBe(11);
  });

  it('parses TSX, classes, anonymous/nested functions, and isolates nested complexity', () => {
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
          return [1].map((n) => n + 1).length + Number(Boolean(inner(true)));
        }
      }
    `;
    const result = analyzeSourceFile('Box.tsx', tsx);
    expect(result.functionCount).toBe(6);
    expect(result.nestedFunctionCount).toBe(1);
    expect(result.maxCyclomaticHotspot?.name).toBe('inner');
    expect(result.maxNestingDepth).toBe(0);
  });
});
