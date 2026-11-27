import { describe, expect, it } from 'vitest';
import { InsertionRule, PolymerFormula, PolymerState } from './polymer';

describe('PolymerFormula', () => {
  it('constructs an immutable formula, allows empty rules, and builds initialState', () => {
    const empty = new PolymerFormula('A', []);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(empty.ruleCount).toBe(0);
    expect(empty.rules).toEqual([]);
    expect(Object.isFrozen(empty.rules)).toBe(true);
    expect(empty.lastElement).toBe('A');
    expect(empty.ruleFor('AA')).toBeUndefined();
    expect(empty.initialState().totalLength).toBe(1n);

    const rules = [new InsertionRule('NN', 'C'), new InsertionRule('NC', 'B')];
    const formula = new PolymerFormula('NNCB', rules);
    expect(formula.ruleCount).toBe(2);
    expect(formula.lastElement).toBe('B');
    expect(formula.ruleFor('NN')?.insert).toBe('C');
    expect(formula.ruleFor('CB')).toBeUndefined();

    const state = formula.initialState();
    expect(state.totalLength).toBe(4n);
    expect(state.countOfPair('NN')).toBe(1n);
    expect(state.countOfPair('NC')).toBe(1n);
    expect(state.countOfPair('CB')).toBe(1n);
    expect(state.countOfPair('ZZ')).toBe(0n);
  });

  it('rejects invalid templates and duplicate rule pairs', () => {
    expect(() => new PolymerFormula('', [])).toThrow(RangeError);
    expect(() => new PolymerFormula('nn', [])).toThrow(RangeError);
    expect(() => new PolymerFormula('NN\nCB', [])).toThrow(RangeError);
    expect(() => new PolymerFormula('N1', [])).toThrow(RangeError);
    expect(
      () => new PolymerFormula('NNCB', [new InsertionRule('NN', 'C'), new InsertionRule('NN', 'B')]),
    ).toThrow(RangeError);
  });
});

describe('PolymerState', () => {
  it('validates inputs, omits zero counts, and returns defensive pairCounts', () => {
    const rawMap = new Map<string, bigint>([
      ['NN', 2n],
      ['NC', 0n],
      ['CB', 1n],
    ]);
    const state = new PolymerState(rawMap, 'B');
    expect(Object.isFrozen(state)).toBe(true);
    expect(state.activePairCount).toBe(2);
    expect(state.countOfPair('NC')).toBe(0n);

    const copy = state.pairCounts;
    expect(copy.size).toBe(2);
    (copy as Map<string, bigint>).set('ZZ', 99n);
    expect(state.countOfPair('ZZ')).toBe(0n);

    expect(() => new PolymerState(new Map([['N', 1n]]), 'B')).toThrow(RangeError);
    expect(() => new PolymerState(new Map([['nn', 1n]]), 'B')).toThrow(RangeError);
    expect(() => new PolymerState(new Map([['NN', -1n]]), 'B')).toThrow(RangeError);
    expect(() => new PolymerState(new Map(), 'BB')).toThrow(RangeError);
    expect(() => new PolymerState(new Map(), 'b')).toThrow(RangeError);
  });

  it('computes element frequencies with anchor element and tie-breaking', () => {
    const single = new PolymerState(new Map(), 'Z');
    expect(single.elementFrequencies).toEqual([{ element: 'Z', count: 1n }]);
    expect(single.mostCommon).toEqual({ element: 'Z', count: 1n });
    expect(single.leastCommon).toEqual({ element: 'Z', count: 1n });
    expect(single.spread).toBe(0n);

    // Polymer "BABAC": pairs BA(2), AB(1), AC(1), anchor C(1) => A:2, B:2, C:1
    const state = new PolymerState(
      new Map([
        ['BA', 1n],
        ['AB', 1n],
        ['BC', 1n],
        ['CB', 1n],
      ]),
      'B',
    );
    // Pairs: BA(1), AB(1), BC(1), CB(1), anchor B => B:3, A:1, C:1
    expect(state.totalLength).toBe(5n);
    expect(state.elementFrequencies).toEqual([
      { element: 'B', count: 3n },
      { element: 'A', count: 1n },
      { element: 'C', count: 1n },
    ]);
    expect(state.mostCommon).toEqual({ element: 'B', count: 3n });
    expect(state.leastCommon).toEqual({ element: 'C', count: 1n });
    expect(state.spread).toBe(2n);

    // Mixed order counts (1, 5, 2) exercise both < and > branches in comparator
    const mixed = new PolymerState(
      new Map([
        ['AA', 1n],
        ['BB', 5n],
        ['CC', 2n],
      ]),
      'D',
    );
    expect(mixed.elementFrequencies).toEqual([
      { element: 'B', count: 5n },
      { element: 'C', count: 2n },
      { element: 'A', count: 1n },
      { element: 'D', count: 1n },
    ]);

    // Equal counts sorted alphabetically ascending: "CAB" -> CA(1), AB(1), anchor B => A:1, B:1, C:1
    const tied = new PolymerState(
      new Map([
        ['CA', 1n],
        ['AB', 1n],
      ]),
      'B',
    );
    expect(tied.elementFrequencies).toEqual([
      { element: 'A', count: 1n },
      { element: 'B', count: 1n },
      { element: 'C', count: 1n },
    ]);
  });

  it('tracks activeReactions, insertionsNext, step with inert pairs, and advance', () => {
    const formula = new PolymerFormula('ABBC', [
      new InsertionRule('AB', 'X'),
      new InsertionRule('BC', 'Y'),
    ]);
    const initial = formula.initialState();
    expect(initial.insertionsNext(formula)).toBe(2n);
    expect(initial.activeReactions(formula)).toEqual([
      { pair: 'AB', insert: 'X', count: 1n },
      { pair: 'BC', insert: 'Y', count: 1n },
    ]);

    const after1 = initial.step(formula);
    // AB -> AX, XB; BB (inert) -> BB; BC -> BY, YC
    expect(after1.totalLength).toBe(6n);
    expect(after1.countOfPair('BB')).toBe(1n);
    expect(after1.countOfPair('AX')).toBe(1n);
    expect(after1.countOfPair('XB')).toBe(1n);
    expect(after1.countOfPair('BY')).toBe(1n);
    expect(after1.countOfPair('YC')).toBe(1n);

    // Step 2: AX, XB, BB, BY, YC are all inert!
    const after2 = after1.step(formula);
    expect(after2.totalLength).toBe(6n);
    expect(after2.activeReactions(formula)).toEqual([]);
    expect(after2.insertionsNext(formula)).toBe(0n);

    // advance(0) preserves state; advance(1) matches step(1)
    expect(initial.advance(formula, 0).pairCounts).toEqual(initial.pairCounts);
    expect(initial.advance(formula, 1).pairCounts).toEqual(after1.pairCounts);
    expect(() => initial.advance(formula, -1)).toThrow(RangeError);
  });

  it('sorts activeReactions by count descending then pair ascending', () => {
    const formula = new PolymerFormula('AAB', [
      new InsertionRule('BC', 'X'),
      new InsertionRule('AB', 'Y'),
      new InsertionRule('CD', 'Z'),
      new InsertionRule('DE', 'W'),
    ]);
    const state = new PolymerState(
      new Map([
        ['DE', 9n],
        ['CD', 2n],
        ['AB', 2n],
        ['BC', 5n],
      ]),
      'E',
    );
    expect(state.activeReactions(formula)).toEqual([
      { pair: 'DE', insert: 'W', count: 9n },
      { pair: 'BC', insert: 'X', count: 5n },
      { pair: 'AB', insert: 'Y', count: 2n },
      { pair: 'CD', insert: 'Z', count: 2n },
    ]);
  });
});
