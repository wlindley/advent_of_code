import { describe, expect, it } from 'vitest';
import { parsePassportBatch } from './passport';
import { PRESENCE_POLICY, STRICT_FIELD_POLICY } from './policy';

const PART2_INVALID = [
  'eyr:1972 cid:100 hcl:#18171d ecl:amb hgt:170 pid:186cm iyr:2018 byr:1926',
  'iyr:2019 hcl:#602927 eyr:1967 hgt:170cm ecl:grn pid:012533040 byr:1946',
  'hcl:dab227 iyr:2012 ecl:brn hgt:182cm pid:021572410 eyr:2020 byr:1992 cid:277',
  'hgt:59cm ecl:zzz eyr:2038 hcl:74454a iyr:2023 pid:3556412378 byr:2007',
].join('\n\n');

const PART2_VALID = [
  'pid:087499704 hgt:74in ecl:grn iyr:2012 eyr:2030 byr:1980 hcl:#623a2f',
  'eyr:2029 ecl:blu cid:129 byr:1989 iyr:2014 pid:896056539 hcl:#a97842 hgt:165cm',
  'hcl:#888785 hgt:164cm byr:2001 iyr:2015 cid:88 pid:545766238 ecl:hzl eyr:2022',
  'iyr:2010 hgt:158cm hcl:#b6652a ecl:blu byr:1944 eyr:2021 pid:093154719',
].join('\n\n');

describe('PRESENCE_POLICY', () => {
  it('accepts passports with all required fields regardless of cid or unknown fields', () => {
    const batch = parsePassportBatch(
      [
        'ecl:gry pid:860033327 eyr:2020 hcl:#fffffd byr:1937 iyr:2017 cid:147 hgt:183cm',
        'hcl:#ae17e1 iyr:2013 eyr:2024 ecl:brn pid:760753108 byr:1931 hgt:179cm extra:ok',
      ].join('\n\n'),
    );

    const first = PRESENCE_POLICY.evaluate(batch.records[0]!);
    const second = PRESENCE_POLICY.evaluate(batch.records[1]!);

    expect(Object.isFrozen(PRESENCE_POLICY)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.record).toBe(batch.records[0]);
    expect(first.policyId).toBe('presence');
    expect(first.policyLabel).toBe('Required fields present (cid optional)');
    expect(first.isValid).toBe(true);
    expect(first.missingFields).toEqual([]);
    expect(first.invalidFields).toEqual([]);
    expect(first.detail).toBe('Valid passport');
    expect(first.fieldChecks.find((c) => c.field === 'cid')?.status).toBe('optional');
    expect(first.fieldChecks.find((c) => c.field === 'cid')?.note).toBe('Optional (present)');

    expect(second.isValid).toBe(true);
    expect(second.fieldChecks.find((c) => c.field === 'cid')?.note).toBe('Optional (omitted)');
  });

  it('reports missing required fields when cid or other fields are present', () => {
    const batch = parsePassportBatch('iyr:2013 ecl:amb cid:350 eyr:2023 pid:028048884 hcl:#cfa07d byr:1929');
    const result = PRESENCE_POLICY.evaluate(batch.records[0]!);

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toEqual(['hgt']);
    expect(result.invalidFields).toEqual([]);
    expect(result.detail).toBe('Missing: hgt');
    expect(result.fieldChecks.find((c) => c.field === 'hgt')).toEqual({
      field: 'hgt',
      status: 'missing',
      value: undefined,
      note: 'Missing required field',
    });
  });
});

describe('STRICT_FIELD_POLICY', () => {
  it('validates official Part 2 valid and invalid examples and ignores unknown extra fields', () => {
    const invalidBatch = parsePassportBatch(PART2_INVALID);
    const validBatch = parsePassportBatch(PART2_VALID);

    for (const record of invalidBatch.records) {
      const evaluation = STRICT_FIELD_POLICY.evaluate(record);
      expect(evaluation.isValid).toBe(false);
      expect(evaluation.missingFields).toEqual([]);
      expect(evaluation.invalidFields.length).toBeGreaterThan(0);
    }

    for (const record of validBatch.records) {
      const evaluation = STRICT_FIELD_POLICY.evaluate(record);
      expect(evaluation.isValid).toBe(true);
      expect(evaluation.detail).toBe('Valid passport');
    }

    const withExtra = parsePassportBatch(
      'iyr:2010 hgt:158cm hcl:#b6652a ecl:blu byr:1944 eyr:2021 pid:093154719 unknown:val',
    );
    expect(STRICT_FIELD_POLICY.evaluate(withExtra.records[0]!).isValid).toBe(true);
  });

  it('reports invalid-only, missing-only, and combined missing+invalid details dynamically', () => {
    const batch = parsePassportBatch(
      [
        'byr:2003 iyr:2010 eyr:2021 hgt:158cm hcl:#b6652a ecl:blu pid:093154719',
        'byr:1944 iyr:2010 eyr:2021 hgt:158cm hcl:#b6652a ecl:blu',
        'byr:1800 iyr:2010 eyr:2021 hgt:158cm hcl:#b6652a ecl:blu',
      ].join('\n\n'),
    );

    const invalidOnly = STRICT_FIELD_POLICY.evaluate(batch.records[0]!);
    const missingOnly = STRICT_FIELD_POLICY.evaluate(batch.records[1]!);
    const both = STRICT_FIELD_POLICY.evaluate(batch.records[2]!);

    expect(Object.isFrozen(STRICT_FIELD_POLICY)).toBe(true);
    expect(Object.isFrozen(invalidOnly)).toBe(true);
    expect(invalidOnly.record).toBe(batch.records[0]);
    expect(invalidOnly.policyId).toBe('strict-fields');
    expect(invalidOnly.policyLabel).toBe('Required fields present and rule-valid');
    expect(invalidOnly.detail).toBe('Invalid: byr');
    expect(invalidOnly.fieldChecks.find((c) => c.field === 'byr')?.status).toBe('invalid');
    expect(missingOnly.detail).toBe('Missing: pid');
    expect(missingOnly.fieldChecks.find((c) => c.field === 'pid')?.status).toBe('missing');
    expect(both.detail).toBe('Missing: pid; Invalid: byr');
    expect(both.isValid).toBe(false);
  });
});
