import { describe, expect, it } from 'vitest';
import { parseMonsterMessages } from './parser';

const SAMPLE_TEXT = [
  '0: 4 1 5',
  '1: 2 3 | 3 2',
  '2: 4 4 | 5 5',
  '3: 4 5 | 5 4',
  '4: "a"',
  '5: "b"',
  '',
  'ababbb',
  'bababa',
  'abbbab',
  'aaabbb',
  'aaaabbb',
].join('\n');

describe('parseMonsterMessages', () => {
  it('parses rules and messages with CRLF and whitespace normalization', () => {
    const crlf = SAMPLE_TEXT.replace(/\n/g, '\r\n') + '\r\n';
    const parsed = parseMonsterMessages(crlf);
    expect(parsed.grammar.ruleCount).toBe(6);
    expect(parsed.grammar.ruleOf(4)).toEqual({ kind: 'terminal', id: 4, symbol: 'a' });
    expect(parsed.grammar.ruleOf(1)).toEqual({
      kind: 'sequence',
      id: 1,
      alternatives: [[2, 3], [3, 2]],
    });
    expect(parsed.messageCount).toBe(5);
    expect(parsed.messages[0]).toBe('ababbb');
  });

  it('rejects empty input or wrong number of sections', () => {
    expect(() => parseMonsterMessages('   \n  ')).toThrow('Input is empty');
    expect(() => parseMonsterMessages('0: "a"')).toThrow('Expected 2 sections');
    expect(() => parseMonsterMessages('0: "a"\n\nabc\n\ndef')).toThrow('Expected 2 sections');
  });

  it('rejects malformed rule lines, empty alternatives, and non-numeric tokens', () => {
    expect(() => parseMonsterMessages('bad line\n\na')).toThrow('Invalid rule line');
    expect(() => parseMonsterMessages('0: 1 | \n1: "a"\n\na')).toThrow('Empty alternative in rule 0');
    expect(() => parseMonsterMessages('0: x\n\na')).toThrow("Invalid token 'x' in rule 0");
    expect(() => parseMonsterMessages('0: "a"\n\nABC')).toThrow('Invalid message');
  });
});
