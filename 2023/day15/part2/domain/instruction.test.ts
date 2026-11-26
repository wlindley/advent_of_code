import { describe, expect, it } from 'vitest';
import { OpticalBench } from './bench';
import {
  parseLensInstruction,
  parseLensInstructions,
  RemoveLensInstruction,
  UpsertLensInstruction,
} from './instruction';

describe('RemoveLensInstruction & UpsertLensInstruction', () => {
  it('freezes instances and computes boxIndex and rawToken dynamically', () => {
    const upsert = new UpsertLensInstruction('rn', 1);
    const remove = new RemoveLensInstruction('cm');
    expect(upsert.label).toBe('rn');
    expect(upsert.focalLength).toBe(1);
    expect(upsert.boxIndex).toBe(0);
    expect(upsert.rawToken).toBe('rn=1');
    expect(Object.isFrozen(upsert)).toBe(true);

    expect(remove.label).toBe('cm');
    expect(remove.boxIndex).toBe(0);
    expect(remove.rawToken).toBe('cm-');
    expect(Object.isFrozen(remove)).toBe(true);
  });

  it('distinguishes case-sensitive labels (rn vs RN)', () => {
    const lower = new UpsertLensInstruction('rn', 1);
    const upper = new UpsertLensInstruction('RN', 1);
    expect(lower.boxIndex).toBe(0);
    expect(upper.boxIndex).not.toBe(lower.boxIndex);
  });

  it('applies instructions polymorphically to an OpticalBench', () => {
    const bench = new OpticalBench();
    const steps = [new UpsertLensInstruction('qp', 3), new RemoveLensInstruction('qp')];
    expect(steps[0]!.apply(bench)).toEqual({ kind: 'inserted', slot: 0 });
    expect(steps[1]!.apply(bench)).toEqual({ kind: 'removed', slot: 0, previousFocalLength: 3 });
  });

  it('validates constructor arguments', () => {
    expect(() => new RemoveLensInstruction('')).toThrow(RangeError);
    expect(() => new UpsertLensInstruction('rn1', 2)).toThrow(RangeError);
    expect(() => new UpsertLensInstruction('rn', 0)).toThrow(RangeError);
  });
});

describe('parseLensInstruction', () => {
  it('parses remove and upsert tokens', () => {
    const remove = parseLensInstruction('cm-');
    expect(remove).toBeInstanceOf(RemoveLensInstruction);
    expect(remove.rawToken).toBe('cm-');

    const upsert = parseLensInstruction('ot=9');
    expect(upsert).toBeInstanceOf(UpsertLensInstruction);
    expect(upsert.rawToken).toBe('ot=9');
  });

  it.each([
    ['empty string', ''],
    ['missing operator', 'rn'],
    ['missing focal length', 'rn='],
    ['zero focal length', 'rn=0'],
    ['two-digit focal length', 'rn=10'],
    ['alpha focal length', 'rn=a'],
    ['negative focal length', 'rn=-1'],
    ['trailing digit on remove', 'cm-1'],
    ['double dash', 'cm--'],
    ['missing label before =', '=1'],
    ['missing label before -', '-'],
    ['numeric label', '123=1'],
    ['underscore in label', 'rn_1=2'],
    ['plus operator', 'rn+1'],
    ['trailing comma', 'rn=1,'],
  ])('rejects invalid token (%s): %s', (_desc, token) => {
    expect(() => parseLensInstruction(token)).toThrow(RangeError);
  });
});

describe('parseLensInstructions', () => {
  it('parses the official 11-step example and returns a frozen array', () => {
    const instructions = parseLensInstructions(
      'rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7',
    );
    expect(Object.isFrozen(instructions)).toBe(true);
    expect(instructions).toHaveLength(11);
    expect(instructions.map((step) => step.rawToken)).toEqual([
      'rn=1',
      'cm-',
      'qp=3',
      'cm=2',
      'qp-',
      'pc=4',
      'ot=9',
      'ab=5',
      'pc-',
      'pc=6',
      'ot=7',
    ]);
  });

  it('ignores CRLF and LF line breaks inside sequence', () => {
    const instructions = parseLensInstructions('rn=1,\r\ncm-,\nqp=3\r\n');
    expect(instructions.map((step) => step.rawToken)).toEqual(['rn=1', 'cm-', 'qp=3']);
  });

  it('rejects whitespace inside sequence tokens', () => {
    expect(() => parseLensInstructions('rn=1, cm-')).toThrow(RangeError);
  });
});
