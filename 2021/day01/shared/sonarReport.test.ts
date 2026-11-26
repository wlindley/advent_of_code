import { describe, expect, it } from 'vitest';
import { SonarReport, parseSonarReport, validateWindowSize } from './sonarReport';

describe('validateWindowSize', () => {
  it('accepts positive safe integers', () => {
    expect(() => validateWindowSize(1)).not.toThrow();
    expect(() => validateWindowSize(3)).not.toThrow();
  });

  it('rejects non-positive or non-integer window sizes', () => {
    for (const bad of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => validateWindowSize(bad)).toThrow(RangeError);
    }
  });
});

describe('SonarReport', () => {
  it('freezes instance and defensive depth copy and computes dynamic stats', () => {
    const source = [200, -5, 208, 199];
    const report = new SonarReport(source);
    source[0] = 9999;

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.depths)).toBe(true);
    expect(report.count).toBe(4);
    expect(report.minDepth).toBe(-5);
    expect(report.maxDepth).toBe(208);
    expect(report.depthAt(0)).toBe(200);
    expect(report.depthAt(3)).toBe(199);
  });

  it('canonicalizes -0 to 0', () => {
    const report = new SonarReport([-0, 10]);
    expect(Object.is(report.depthAt(0), 0)).toBe(true);
  });

  it('rejects empty reports and non-safe-integer depths', () => {
    expect(() => new SonarReport([])).toThrow(RangeError);
    for (const bad of [1.25, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => new SonarReport([10, bad])).toThrow(RangeError);
    }
  });

  it('validates index bounds in depthAt', () => {
    const report = new SonarReport([10, 20]);
    for (const bad of [-1, 2, 0.5, Number.NaN]) {
      expect(() => report.depthAt(bad)).toThrow(RangeError);
    }
  });

  it('computes exact BigInt window sums and validates bounds', () => {
    const big = Number.MAX_SAFE_INTEGER;
    const report = new SonarReport([big, big, 5]);
    expect(report.windowSum(0, 2)).toBe(BigInt(big) * 2n);
    expect(report.windowSum(1, 2)).toBe(BigInt(big) + 5n);
    expect(report.windowSum(2, 1)).toBe(5n);

    expect(() => report.windowSum(0, 0)).toThrow(RangeError);
    for (const badStart of [-1, 0.5, 2]) {
      expect(() => report.windowSum(badStart, 2)).toThrow(RangeError);
    }
  });
});

describe('parseSonarReport', () => {
  it('parses CRLF/LF inputs, trims whitespace, ignores blank lines, and normalizes -0', () => {
    const raw = '\n  199  \r\n\r\n -0 \n -12\r\n200\n ';
    const report = parseSonarReport(raw);
    expect(report.depths).toEqual([199, 0, -12, 200]);
    expect(Object.is(report.depthAt(1), 0)).toBe(true);
  });

  it('rejects empty input, malformed lines, and unsafe integers', () => {
    expect(() => parseSonarReport('  \r\n\n ')).toThrow(RangeError);
    for (const bad of ['199a', '12.5', '+10', '--3']) {
      expect(() => parseSonarReport(bad)).toThrow(SyntaxError);
    }
    expect(() => parseSonarReport('9007199254740992')).toThrow(RangeError);
  });
});
