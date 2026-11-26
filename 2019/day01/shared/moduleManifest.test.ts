import { describe, expect, it } from 'vitest';
import { ModuleManifest, parseModuleMasses } from './moduleManifest';

describe('ModuleManifest', () => {
  it('stores frozen masses and computes count, totalMass, and maxMass dynamically', () => {
    const manifest = new ModuleManifest([1969, 12, 100756, 14]);
    expect(Object.isFrozen(manifest)).toBe(true);
    expect(Object.isFrozen(manifest.masses)).toBe(true);
    expect(manifest.masses).toEqual([1969, 12, 100756, 14]);
    expect(manifest.count).toBe(4);
    expect(manifest.totalMass).toBe(102751);
    expect(manifest.maxMass).toBe(100756);
  });

  it('supports zero-mass modules cleanly without underflowing maxMass', () => {
    const manifest = new ModuleManifest([0]);
    expect(manifest.count).toBe(1);
    expect(manifest.totalMass).toBe(0);
    expect(manifest.maxMass).toBe(0);
  });

  it('rejects empty mass arrays and invalid masses', () => {
    expect(() => new ModuleManifest([])).toThrow(Error);
    expect(() => new ModuleManifest([-1])).toThrow(RangeError);
    expect(() => new ModuleManifest([1.5])).toThrow(RangeError);
  });
});

describe('parseModuleMasses', () => {
  it('parses LF and CRLF inputs with whitespace and blank lines', () => {
    const manifest = parseModuleMasses('  12 \r\n\r\n 14\n1969 \n\n100756  \n');
    expect(manifest.masses).toEqual([12, 14, 1969, 100756]);
  });

  it('rejects empty inputs, non-numeric lines, negative tokens, and unsafe integers', () => {
    expect(() => parseModuleMasses('   \n\t\n')).toThrow(Error);
    expect(() => parseModuleMasses('12\nabc\n14')).toThrow(/line 2/);
    expect(() => parseModuleMasses('-5')).toThrow(/line 1/);
    expect(() => parseModuleMasses('12.5')).toThrow(/line 1/);
    expect(() => parseModuleMasses('99999999999999999999')).toThrow(RangeError);
  });
});
