import { describe, expect, it } from 'vitest';
import { ControlInstruction, MulInstruction } from './instruction';
import { parseCorruptedMemory, ParsedMemory } from './memory';

const TOKEN_ORACLE_RE = /mul\((\d{1,3}),(\d{1,3})\)|do\(\)|don't\(\)/g;

interface OracleToken {
  readonly kind: 'mul' | 'do' | 'dont';
  readonly x?: number;
  readonly y?: number;
  readonly start: number;
  readonly end: number;
}

function scanWithOracle(raw: string): readonly OracleToken[] {
  const tokens: OracleToken[] = [];
  for (const match of raw.matchAll(TOKEN_ORACLE_RE)) {
    const start = match.index!;
    const end = start + match[0].length;
    if (match[0].startsWith('mul')) {
      tokens.push({ kind: 'mul', x: Number(match[1]), y: Number(match[2]), start, end });
    } else if (match[0] === 'do()') {
      tokens.push({ kind: 'do', start, end });
    } else {
      tokens.push({ kind: 'dont', start, end });
    }
  }
  return tokens;
}

function serializeParsed(memory: ParsedMemory): readonly OracleToken[] {
  return memory.instructions.map((inst) =>
    inst.kind === 'mul'
      ? { kind: 'mul', x: inst.x, y: inst.y, start: inst.start, end: inst.end }
      : { kind: inst.kind, start: inst.start, end: inst.end },
  );
}

function buildSeededCorpus(targetBytes: number, seed: number): string {
  const fragments = [
    'mul(', 'mul(12,', 'mul(123,45)', 'mul(0,999)', 'mul(999,999)', 'mul(1234,5)',
    'mul(4,mul(2,3))', 'mulmul(7,8)', 'mmul(9,1)', 'do()', "don't()", 'do(mul(1,2))',
    "don't(mul(3,4))", 'domul(5,6)', "don'tdo()", 'mul(1,\n2)', '\n', '\r\n', 'xyz?![]',
  ];
  let state = seed >>> 0;
  let out = '';
  while (out.length < targetBytes) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    out += fragments[state % fragments.length]!;
  }
  return out;
}

describe('ParsedMemory', () => {
  it('freezes instructions, defensively copies, and filters mulInstructions', () => {
    const m1 = new MulInstruction(2, 4, 0, 8);
    const c1 = new ControlInstruction('dont', 8, 15);
    const m2 = new MulInstruction(3, 5, 15, 23);
    const input = [m1, c1, m2];
    const mem = new ParsedMemory('mul(2,4)don\'t()mul(3,5)', input);
    input.pop();
    expect(Object.isFrozen(mem)).toBe(true);
    expect(Object.isFrozen(mem.instructions)).toBe(true);
    expect(mem.instructions).toEqual([m1, c1, m2]);
    const muls = mem.mulInstructions;
    expect(Object.isFrozen(muls)).toBe(true);
    expect(muls).toEqual([m1, m2]);
  });

  it('rejects overlapping, out-of-order, or out-of-bounds spans with RangeError', () => {
    const a = new MulInstruction(1, 2, 2, 10);
    const overlap = new MulInstruction(3, 4, 9, 17);
    expect(() => new ParsedMemory('xxmul(1,2)mul(3,4)', [a, overlap])).toThrow(RangeError);
    expect(() => new ParsedMemory('mul(1,2)', [new MulInstruction(1, 2, 0, 9)])).toThrow(RangeError);
  });
});

describe('parseCorruptedMemory', () => {
  it('parses empty input and noise without errors', () => {
    for (const raw of ['', '   \n\r\n!@#$%^&*()_+', 'm mu mul d do don don\'t']) {
      const mem = parseCorruptedMemory(raw);
      expect(mem.raw).toBe(raw);
      expect(mem.instructions).toEqual([]);
      expect(mem.mulInstructions).toEqual([]);
    }
  });

  it('parses the official example and multi-line continuous streams', () => {
    const example = 'xmul(2,4)%&mul[3,7]!@^do_not_mul(5,5)+mul(32,64]then(mul(11,8)mul(8,5))';
    const mem = parseCorruptedMemory(example);
    expect(mem.mulInstructions.map((m) => [m.x, m.y, m.product])).toEqual([
      [2, 4, 8],
      [5, 5, 25],
      [11, 8, 88],
      [8, 5, 40],
    ]);

    const multiline = "mul(0,999)\n\r\ndon't()mul(10,20)\ndo()mul(999,999)";
    const multi = parseCorruptedMemory(multiline);
    expect(multi.instructions.map((i) => i.kind)).toEqual(['mul', 'dont', 'mul', 'do', 'mul']);
    expect(multi.mulInstructions.map((m) => m.product)).toEqual([0, 200, 998_001]);
  });

  it('matches regex matchAll oracle on all adversarial prefix/EOF cases and 20 KB corpus', () => {
    const adversarial = [
      'mmul(2,3)', 'mulmul(2,3)', 'mul[3,7]', 'mul(4,mul(2,3))', 'mul(12,34mul(5,6))',
      'mul(1234,5)', 'mul(5,1234)', 'mul( 1,2)', 'mul(1, 2)', 'mul(-1,2)', 'mul(,2)', 'mul(1,)',
      'mul(2,\n4)', 'mul(000,007)', 'do(mul(2,3))', 'domul(2,3)', 'dodo()', 'ddon\'t()',
      'donx', "don't(mul(2,3))", "don'tdo()", "don'tmul(2,3)",
      'm', 'mu', 'mul', 'mul(', 'mul(1', 'mul(1,', 'mul(1,2', 'd', 'do', 'do(', 'don', "don'", "don't", "don't(",
    ];
    for (const sample of adversarial) {
      expect(serializeParsed(parseCorruptedMemory(sample))).toEqual(scanWithOracle(sample));
    }
    const corpus = buildSeededCorpus(20 * 1024, 20241203);
    expect(corpus.length).toBeGreaterThanOrEqual(20 * 1024);
    expect(serializeParsed(parseCorruptedMemory(corpus))).toEqual(scanWithOracle(corpus));
  });
});
