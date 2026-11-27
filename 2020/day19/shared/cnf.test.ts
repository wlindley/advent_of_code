import { describe, expect, it } from 'vitest';
import { compileCnf } from './cnf';
import { Grammar, type GrammarRule } from './grammar';

describe('compileCnf', () => {
  it('compiles terminals, unit chains, binary rules, and k>=3 right-binarization', () => {
    const grammar = new Grammar([
      { kind: 'sequence', id: 0, alternatives: [[1]] },
      { kind: 'sequence', id: 1, alternatives: [[2, 3, 2]] },
      { kind: 'terminal', id: 2, symbol: 'a' },
      { kind: 'terminal', id: 3, symbol: 'b' },
    ]);
    const cnf = compileCnf(grammar);
    expect(cnf.startSymbol).toBe(0);
    expect(cnf.origCount).toBe(4);
    expect(cnf.syntheticCount).toBe(1);
    expect(cnf.symbolCount).toBe(5);
    expect(cnf.wordCount).toBe(1);
    expect(cnf.origWordCount).toBe(1);
    expect(cnf.lastOrigWordMask).toBe(0b1111);
    expect(cnf.rule42Sym).toBe(-1);
    expect(cnf.rule31Sym).toBe(-1);
    expect(cnf.symToRuleId).toEqual(new Int32Array([0, 1, 2, 3]));
    expect(Object.isFrozen(cnf)).toBe(true);
    // Rule 0 ->* Rule 1 -> (2, synth 4); both 0 and 1 share binary rule (2, 4).
    expect(cnf.binaryRuleCount).toBe(3);
    // Terminal 'a' mask has bit 2 set.
    expect(cnf.terminalMasks[0]! & (1 << 2)).not.toBe(0);
    // Terminal 'b' mask has bit 3 set.
    expect(cnf.terminalMasks[1]! & (1 << 3)).not.toBe(0);
  });

  it('handles unit cycles and deduplicates diamond binary rule propagation', () => {
    const grammar = new Grammar([
      { kind: 'sequence', id: 0, alternatives: [[1], [2]] },
      { kind: 'sequence', id: 1, alternatives: [[2], [3, 4]] },
      { kind: 'sequence', id: 2, alternatives: [[1], [3, 4]] },
      { kind: 'terminal', id: 3, symbol: 'a' },
      { kind: 'terminal', id: 4, symbol: 'b' },
    ]);
    const cnf = compileCnf(grammar);
    // Unit closure makes 0, 1, 2 all derive (3, 4) once each => 3 deduplicated binary rules.
    expect(cnf.binaryRuleCount).toBe(3);
  });

  it('tracks rule42Sym, rule31Sym, and multi-word bitmask boundaries (> 32 rules)', () => {
    const rules: GrammarRule[] = [{ kind: 'sequence', id: 0, alternatives: [[42, 31]] }];
    for (let i = 1; i <= 32; i += 1) {
      const id = i === 1 ? 42 : i === 2 ? 31 : i + 100;
      rules.push({ kind: 'terminal', id, symbol: i % 2 === 0 ? 'a' : 'b' });
    }
    const grammar = new Grammar(rules);
    const cnf = compileCnf(grammar);
    expect(cnf.origCount).toBe(33);
    expect(cnf.origWordCount).toBe(2);
    expect(cnf.lastOrigWordMask).toBe(1);
    expect(cnf.rule42Sym).toBe(2);
    expect(cnf.rule31Sym).toBe(1);
  });
});
