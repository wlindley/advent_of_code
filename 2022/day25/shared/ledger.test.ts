import { describe, expect, it } from 'vitest';
import { parseFuelLedger, SnafuLedger } from './ledger';
import { SnafuNumber } from './snafu';

const OFFICIAL_LEDGER = [
  '1=-0-2',
  '12111',
  '2=0=',
  '21',
  '2=01',
  '111',
  '20012',
  '112',
  '1=-1=',
  '1-12',
  '12',
  '1=',
  '122',
].join('\n');

describe('SnafuLedger', () => {
  it('enforces non-empty entries and freezes defensive copy', () => {
    expect(() => new SnafuLedger([])).toThrow(RangeError);

    const src = [new SnafuNumber('2'), new SnafuNumber('=')];
    const ledger = new SnafuLedger(src);
    src.push(new SnafuNumber('1'));

    expect(Object.isFrozen(ledger)).toBe(true);
    expect(Object.isFrozen(ledger.entries)).toBe(true);
    expect(ledger.count).toBe(2);
    expect(ledger.maxLength).toBe(1);
    expect(ledger.totalDecimal).toBe(0n);
    expect(ledger.totalSnafu).toBe('0');
  });

  it('computes negative totals and maxLength dynamically', () => {
    const ledger = new SnafuLedger([new SnafuNumber('=0'), new SnafuNumber('-')]);
    expect(ledger.count).toBe(2);
    expect(ledger.maxLength).toBe(2);
    expect(ledger.totalDecimal).toBe(-11n);
    expect(ledger.totalSnafu).toBe('=-');
  });
});

describe('parseFuelLedger', () => {
  it('parses the official 13-line example ledger to 4890 / 2=-1=0', () => {
    const ledger = parseFuelLedger(OFFICIAL_LEDGER);
    expect(ledger.count).toBe(13);
    expect(ledger.maxLength).toBe(6);
    expect(ledger.totalDecimal).toBe(4890n);
    expect(ledger.totalSnafu).toBe('2=-1=0');
  });

  it('trims whitespace, ignores blank lines, and handles CRLF', () => {
    const ledger = parseFuelLedger('  10 \r\n\r\n  2  \n  \n');
    expect(ledger.count).toBe(2);
    expect(ledger.totalDecimal).toBe(7n);
    expect(ledger.totalSnafu).toBe('12');
  });

  it('rejects empty, blank-only, and invalid-digit inputs', () => {
    expect(() => parseFuelLedger('')).toThrow(RangeError);
    expect(() => parseFuelLedger('  \n\r\n  ')).toThrow(RangeError);
    expect(() => parseFuelLedger('10\n3\n')).toThrow(RangeError);
  });
});
