import {
  ALL_QUESTIONS_MASK,
  assertValidQuestionIndex,
  assertValidQuestionMask,
  encodeAnswerLine,
  formatQuestionMask,
  hasQuestion,
  popcount26,
} from './question';

/** Immutable 26-bit declaration mask for one person's "yes" answers. */
export class PersonDeclaration {
  readonly mask: number;

  constructor(mask: number) {
    assertValidQuestionMask(mask);
    this.mask = mask;
    Object.freeze(this);
  }

  static fromLine(line: string): PersonDeclaration {
    return new PersonDeclaration(encodeAnswerLine(line));
  }

  get yesCount(): number {
    return popcount26(this.mask);
  }

  get letters(): string {
    return formatQuestionMask(this.mask);
  }

  answered(questionIndex: number): boolean {
    return hasQuestion(this.mask, questionIndex);
  }
}

/** Immutable non-empty group of person declarations. */
export class CustomsGroup {
  readonly people: readonly PersonDeclaration[];

  constructor(people: readonly PersonDeclaration[]) {
    if (people.length === 0) {
      throw new RangeError('Customs group must contain at least one person');
    }
    this.people = Object.freeze([...people]);
    Object.freeze(this);
  }

  get size(): number {
    return this.people.length;
  }

  get anyYesMask(): number {
    let mask = 0;
    for (const person of this.people) {
      mask |= person.mask;
    }
    return mask;
  }

  get allYesMask(): number {
    let mask = ALL_QUESTIONS_MASK;
    for (const person of this.people) {
      mask &= person.mask;
    }
    return mask;
  }

  countResponders(questionIndex: number): number {
    assertValidQuestionIndex(questionIndex);
    let count = 0;
    for (const person of this.people) {
      if (person.answered(questionIndex)) {
        count += 1;
      }
    }
    return count;
  }
}

/** Immutable non-empty batch of customs groups parsed from puzzle input. */
export class CustomsBatch {
  readonly groups: readonly CustomsGroup[];

  constructor(groups: readonly CustomsGroup[]) {
    if (groups.length === 0) {
      throw new RangeError('Customs batch must contain at least one group');
    }
    this.groups = Object.freeze([...groups]);
    Object.freeze(this);
  }

  get groupCount(): number {
    return this.groups.length;
  }

  get totalPeople(): number {
    let total = 0;
    for (const group of this.groups) {
      total += group.size;
    }
    return total;
  }
}

/** Parses blank-line-separated customs group declarations into a `CustomsBatch`. */
export function parseCustomsBatch(raw: string): CustomsBatch {
  const groups: CustomsGroup[] = [];
  let current: PersonDeclaration[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) {
      if (current.length > 0) {
        groups.push(new CustomsGroup(current));
        current = [];
      }
    } else {
      current.push(PersonDeclaration.fromLine(line));
    }
  }
  if (current.length > 0) {
    groups.push(new CustomsGroup(current));
  }
  return new CustomsBatch(groups);
}
