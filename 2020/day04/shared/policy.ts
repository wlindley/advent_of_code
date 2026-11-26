import { STRICT_FIELD_RULES, type FieldRule } from './fieldRules';
import {
  OPTIONAL_PASSPORT_FIELD,
  PassportRecord,
  REQUIRED_PASSPORT_FIELDS,
  type RequiredPassportField,
  type StandardPassportField,
} from './passport';

export type PassportPolicyId = 'presence' | 'strict-fields';
export type FieldCheckStatus = 'valid' | 'missing' | 'invalid' | 'optional';

export interface FieldCheckResult {
  readonly field: StandardPassportField;
  readonly status: FieldCheckStatus;
  readonly value: string | undefined;
  readonly note: string;
}

export interface PassportEvaluation {
  readonly record: PassportRecord;
  readonly policyId: PassportPolicyId;
  readonly policyLabel: string;
  readonly isValid: boolean;
  readonly missingFields: readonly RequiredPassportField[];
  readonly invalidFields: readonly RequiredPassportField[];
  readonly fieldChecks: readonly FieldCheckResult[];
  readonly detail: string;
}

export interface PassportValidationPolicy {
  readonly id: PassportPolicyId;
  readonly label: string;
  evaluate(record: PassportRecord): PassportEvaluation;
}

function findMissingFields(record: PassportRecord): readonly RequiredPassportField[] {
  const missing: RequiredPassportField[] = [];
  for (const field of REQUIRED_PASSPORT_FIELDS) {
    if (!record.hasField(field)) missing.push(field);
  }
  return Object.freeze(missing);
}

function findInvalidFields(
  record: PassportRecord,
  rules: Readonly<Record<RequiredPassportField, FieldRule>>,
): readonly RequiredPassportField[] {
  const invalid: RequiredPassportField[] = [];
  for (const field of REQUIRED_PASSPORT_FIELDS) {
    const value = record.fieldValue(field);
    if (value !== undefined && !rules[field].isValid(value)) invalid.push(field);
  }
  return Object.freeze(invalid);
}

function makeRequiredCheck(record: PassportRecord, field: RequiredPassportField, rule: FieldRule | undefined): FieldCheckResult {
  const value = record.fieldValue(field);
  if (value === undefined) return Object.freeze({ field, status: 'missing', value, note: 'Missing required field' });
  if (!rule) return Object.freeze({ field, status: 'valid', value, note: 'Present' });
  const ok = rule.isValid(value);
  return Object.freeze({ field, status: ok ? 'valid' : 'invalid', value, note: ok ? `Matches ${rule.description}` : `Expected ${rule.description}` });
}

function buildFieldChecks(
  record: PassportRecord,
  rules: Readonly<Record<RequiredPassportField, FieldRule>> | undefined,
): readonly FieldCheckResult[] {
  const checks: FieldCheckResult[] = [];
  for (const field of REQUIRED_PASSPORT_FIELDS) checks.push(makeRequiredCheck(record, field, rules?.[field]));
  const cidValue = record.fieldValue(OPTIONAL_PASSPORT_FIELD);
  checks.push(Object.freeze({ field: OPTIONAL_PASSPORT_FIELD, status: 'optional', value: cidValue, note: cidValue === undefined ? 'Optional (omitted)' : 'Optional (present)' }));
  return Object.freeze(checks);
}

function formatEvaluationDetail(missing: readonly RequiredPassportField[], invalid: readonly RequiredPassportField[]): string {
  if (missing.length === 0 && invalid.length === 0) return 'Valid passport';
  if (missing.length > 0 && invalid.length > 0) return `Missing: ${missing.join(', ')}; Invalid: ${invalid.join(', ')}`;
  if (missing.length > 0) return `Missing: ${missing.join(', ')}`;
  return `Invalid: ${invalid.join(', ')}`;
}

/** Dynamic Part 1 presence evaluation storing only source record and policy. */
export class PresenceEvaluation implements PassportEvaluation {
  readonly #record: PassportRecord;
  readonly #policy: PassportValidationPolicy;
  constructor(record: PassportRecord, policy: PassportValidationPolicy) {
    this.#record = record;
    this.#policy = policy;
    Object.freeze(this);
  }
  get record(): PassportRecord { return this.#record; }
  get policyId(): PassportPolicyId { return this.#policy.id; }
  get policyLabel(): string { return this.#policy.label; }
  get missingFields(): readonly RequiredPassportField[] { return findMissingFields(this.#record); }
  get invalidFields(): readonly RequiredPassportField[] { return Object.freeze([]); }
  get isValid(): boolean { return this.missingFields.length === 0; }
  get fieldChecks(): readonly FieldCheckResult[] { return buildFieldChecks(this.#record, undefined); }
  get detail(): string { return formatEvaluationDetail(this.missingFields, this.invalidFields); }
}

/** Policy requiring the seven mandatory fields (`cid` optional). */
export class PresencePolicy implements PassportValidationPolicy {
  readonly id = 'presence' as const;
  readonly label = 'Required fields present (cid optional)';
  constructor() { Object.freeze(this); }
  evaluate(record: PassportRecord): PassportEvaluation { return new PresenceEvaluation(record, this); }
}

/** Dynamic Part 2 strict evaluation storing only source record, policy, and rules. */
export class StrictFieldEvaluation implements PassportEvaluation {
  readonly #record: PassportRecord;
  readonly #policy: PassportValidationPolicy;
  readonly #rules: Readonly<Record<RequiredPassportField, FieldRule>>;
  constructor(record: PassportRecord, policy: PassportValidationPolicy, rules: Readonly<Record<RequiredPassportField, FieldRule>>) {
    this.#record = record;
    this.#policy = policy;
    this.#rules = rules;
    Object.freeze(this);
  }
  get record(): PassportRecord { return this.#record; }
  get policyId(): PassportPolicyId { return this.#policy.id; }
  get policyLabel(): string { return this.#policy.label; }
  get missingFields(): readonly RequiredPassportField[] { return findMissingFields(this.#record); }
  get invalidFields(): readonly RequiredPassportField[] { return findInvalidFields(this.#record, this.#rules); }
  get isValid(): boolean { return this.missingFields.length === 0 && this.invalidFields.length === 0; }
  get fieldChecks(): readonly FieldCheckResult[] { return buildFieldChecks(this.#record, this.#rules); }
  get detail(): string { return formatEvaluationDetail(this.missingFields, this.invalidFields); }
}

/** Policy requiring all seven mandatory fields to satisfy their value rules. */
export class StrictFieldPolicy implements PassportValidationPolicy {
  readonly id = 'strict-fields' as const;
  readonly label = 'Required fields present and rule-valid';
  readonly #rules: Readonly<Record<RequiredPassportField, FieldRule>>;
  constructor(rules: Readonly<Record<RequiredPassportField, FieldRule>>) {
    this.#rules = Object.freeze({ ...rules });
    Object.freeze(this);
  }
  evaluate(record: PassportRecord): PassportEvaluation { return new StrictFieldEvaluation(record, this, this.#rules); }
}

export const PRESENCE_POLICY: PassportValidationPolicy = new PresencePolicy();
export const STRICT_FIELD_POLICY: PassportValidationPolicy = new StrictFieldPolicy(STRICT_FIELD_RULES);
