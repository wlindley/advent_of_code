import { describe, expect, it } from 'vitest';
import { parseCircuitBlueprint } from './parser';

describe('day20 parseCircuitBlueprint', () => {
  it('parses broadcaster, flip-flops, conjunctions, and implicit sinks', () => {
    const raw = [
      'broadcaster -> a',
      '%a -> inv, con',
      '&inv -> b',
      '%b -> con',
      '&con -> output',
    ].join('\n');

    const bp = parseCircuitBlueprint(raw);
    expect(bp.moduleCount).toBe(6);
    expect(bp.specOf('broadcaster').kind).toBe('broadcaster');
    expect(bp.specOf('a').kind).toBe('flip-flop');
    expect(bp.specOf('inv').kind).toBe('conjunction');
    expect(bp.specOf('output').kind).toBe('sink');
    expect(bp.inputsOf('con')).toEqual(['a', 'b']);
  });

  it('handles CRLF line endings, blank lines, and extra whitespace', () => {
    const raw = '\r\n  broadcaster -> a, b  \r\n\r\n  %a -> b\r\n  &b -> rx \r\n';
    const bp = parseCircuitBlueprint(raw);
    expect(bp.nodeOrder).toEqual(['broadcaster', 'a', 'b', 'rx']);
    expect(bp.outputsOf('broadcaster')).toEqual(['a', 'b']);
  });

  it('rejects every malformed input line or topology error', () => {
    const invalidInputs = [
      '',
      '   \r\n  ',
      'broadcaster a',
      'broadcaster -> a -> b',
      'broadcaster -> ',
      'broadcaster -> a, ',
      'broadcaster -> a\nfoo -> a',
      'broadcaster -> a\n@a -> b',
      'broadcaster -> a\n% a -> b',
      '%broadcaster -> a',
      '&broadcaster -> a',
      'broadcaster -> button',
      'broadcaster -> a\n%button -> a',
      '%a -> b',
      'broadcaster -> a\n%a -> b\n&a -> b',
    ];
    for (const raw of invalidInputs) {
      expect(() => parseCircuitBlueprint(raw)).toThrow();
    }
  });
});
