import { describe, expect, it } from 'vitest';
import { JetPattern, parseJetPattern } from './jetPattern';

describe('JetPattern and parseJetPattern', () => {
  it('parses a valid jet stream, trims outer whitespace, and exposes length and direction', () => {
    const pattern = parseJetPattern('  <<>>< \n');
    expect(pattern).toBeInstanceOf(JetPattern);
    expect(Object.isFrozen(pattern)).toBe(true);
    expect(pattern.sequence).toBe('<<>><');
    expect(pattern.length).toBe(5);
    expect(pattern.isLeftAt(0)).toBe(true);
    expect(pattern.isLeftAt(1)).toBe(true);
    expect(pattern.isLeftAt(2)).toBe(false);
    expect(pattern.isLeftAt(3)).toBe(false);
    expect(pattern.isLeftAt(4)).toBe(true);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(() => parseJetPattern('')).toThrow();
    expect(() => parseJetPattern('  \n\t  ')).toThrow();
  });

  it('rejects invalid characters and embedded whitespace', () => {
    expect(() => parseJetPattern('< >')).toThrow();
    expect(() => parseJetPattern('<\n>')).toThrow();
    expect(() => parseJetPattern('<>x<>')).toThrow();
  });
});
