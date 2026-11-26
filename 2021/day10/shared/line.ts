import {
  AUTOCOMPLETE_MULTIPLIER, AUTOCOMPLETE_POINTS, CORRUPTION_POINTS, isCloseBracket, isOpenBracket,
  MATCHING_CLOSE, type CloseBracket, type OpenBracket,
} from './brackets';

export type CharRole = 'matched' | 'unclosed' | 'clash' | 'unscanned';
export interface AutocompleteStep { readonly closer: CloseBracket; readonly points: bigint; readonly runningScore: bigint; }

/** Validates that `text` is non-empty and consists solely of bracket characters. */
export function validateBracketText(text: string): void {
  if (text.length === 0) throw new RangeError('Syntax line must be non-empty');
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i);
    if (!isOpenBracket(ch) && !isCloseBracket(ch)) throw new SyntaxError(`Invalid bracket "${ch}" at ${i}`);
  }
}

function validateLineMeta(lineIndex: number, text: string): void {
  if (!Number.isInteger(lineIndex) || lineIndex < 0) throw new RangeError(`Invalid lineIndex: ${lineIndex}`);
  validateBracketText(text);
}

function validateOpenStackIndices(text: string, indices: readonly number[], upperBound: number): readonly number[] {
  let prev = -1;
  for (const idx of indices) {
    if (!Number.isInteger(idx) || idx <= prev || idx >= upperBound) throw new RangeError(`Invalid stack index ${idx}`);
    if (!isOpenBracket(text.charAt(idx))) throw new SyntaxError(`Expected open bracket at ${idx}`);
    prev = idx;
  }
  return Object.freeze([...indices]);
}

function readOpenStack(text: string, indices: readonly number[]): readonly OpenBracket[] {
  return Object.freeze(indices.map((idx) => text.charAt(idx) as OpenBracket));
}

function buildAutocompleteSteps(openStack: readonly OpenBracket[]): readonly AutocompleteStep[] {
  let running = 0n;
  const steps: AutocompleteStep[] = [];
  for (let i = openStack.length - 1; i >= 0; i -= 1) {
    const closer = MATCHING_CLOSE[openStack[i]!];
    const points = AUTOCOMPLETE_POINTS[closer];
    running = running * AUTOCOMPLETE_MULTIPLIER + points;
    steps.push(Object.freeze({ closer, points, runningScore: running }));
  }
  return Object.freeze(steps);
}

/** Immutable classification for a line whose first syntax error is an illegal closer. */
export class CorruptedLineResult {
  readonly status = 'corrupted' as const;
  readonly lineIndex: number;
  readonly text: string;
  readonly errorIndex: number;
  readonly openStackIndices: readonly number[];
  constructor(lineIndex: number, text: string, errorIndex: number, openStackIndices: readonly number[]) {
    validateLineMeta(lineIndex, text);
    if (!Number.isInteger(errorIndex) || errorIndex < 0 || errorIndex >= text.length) throw new RangeError(`Invalid errorIndex ${errorIndex}`);
    const found = text.charAt(errorIndex);
    if (!isCloseBracket(found)) throw new SyntaxError(`errorIndex ${errorIndex} must point to a closing bracket`);
    const frozen = validateOpenStackIndices(text, openStackIndices, errorIndex);
    if (frozen.length > 0 && MATCHING_CLOSE[text.charAt(frozen[frozen.length - 1]!) as OpenBracket] === found) {
      throw new RangeError(`Closer "${found}" at ${errorIndex} matches top opener`);
    }
    this.lineIndex = lineIndex; this.text = text; this.errorIndex = errorIndex; this.openStackIndices = frozen;
    Object.freeze(this);
  }
  get found(): CloseBracket { return this.text.charAt(this.errorIndex) as CloseBracket; }
  get expectedOpenIndex(): number | null {
    return this.openStackIndices.length === 0 ? null : this.openStackIndices[this.openStackIndices.length - 1]!;
  }
  get expected(): CloseBracket | null {
    const idx = this.expectedOpenIndex;
    return idx === null ? null : MATCHING_CLOSE[this.text.charAt(idx) as OpenBracket];
  }
  get corruptionScore(): bigint { return CORRUPTION_POINTS[this.found]; }
  get openStack(): readonly OpenBracket[] { return readOpenStack(this.text, this.openStackIndices); }
  get charRoles(): readonly CharRole[] {
    const unclosed = new Set(this.openStackIndices);
    return Object.freeze(Array.from({ length: this.text.length }, (_, i): CharRole =>
      i === this.errorIndex ? 'clash' : i > this.errorIndex ? 'unscanned' : unclosed.has(i) ? 'unclosed' : 'matched'));
  }
}

/** Immutable classification for a valid but unclosed line requiring autocomplete closers. */
export class IncompleteLineResult {
  readonly status = 'incomplete' as const;
  readonly lineIndex: number;
  readonly text: string;
  readonly openStackIndices: readonly number[];
  constructor(lineIndex: number, text: string, openStackIndices: readonly number[]) {
    validateLineMeta(lineIndex, text);
    const frozen = validateOpenStackIndices(text, openStackIndices, text.length);
    if (frozen.length === 0) throw new RangeError('IncompleteLineResult requires at least one unclosed bracket');
    this.lineIndex = lineIndex; this.text = text; this.openStackIndices = frozen;
    Object.freeze(this);
  }
  get openStack(): readonly OpenBracket[] { return readOpenStack(this.text, this.openStackIndices); }
  get autocompleteSteps(): readonly AutocompleteStep[] { return buildAutocompleteSteps(this.openStack); }
  get completion(): readonly CloseBracket[] { return Object.freeze(this.autocompleteSteps.map((s) => s.closer)); }
  get completionText(): string { return this.completion.join(''); }
  get autocompleteScore(): bigint { const s = this.autocompleteSteps; return s[s.length - 1]!.runningScore; }
  get charRoles(): readonly CharRole[] {
    const unclosed = new Set(this.openStackIndices);
    return Object.freeze(Array.from({ length: this.text.length }, (_, i): CharRole => (unclosed.has(i) ? 'unclosed' : 'matched')));
  }
}

/** Immutable classification for a fully balanced navigation subsystem line. */
export class CompleteLineResult {
  readonly status = 'complete' as const;
  readonly lineIndex: number;
  readonly text: string;
  constructor(lineIndex: number, text: string) {
    validateLineMeta(lineIndex, text);
    this.lineIndex = lineIndex; this.text = text;
    Object.freeze(this);
  }
  get openStack(): readonly OpenBracket[] { return Object.freeze([]); }
  get charRoles(): readonly CharRole[] { return Object.freeze(Array.from({ length: this.text.length }, () => 'matched' as const)); }
}

export type SyntaxLineResult = CorruptedLineResult | IncompleteLineResult | CompleteLineResult;

/** Validates `text` upfront and classifies it via a single stack pass. */
export function classifySyntaxLine(lineIndex: number, text: string): SyntaxLineResult {
  validateBracketText(text);
  const stack: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i);
    if (isOpenBracket(ch)) { stack.push(i); continue; }
    const top = stack.pop();
    if (top === undefined) return new CorruptedLineResult(lineIndex, text, i, []);
    if (MATCHING_CLOSE[text.charAt(top) as OpenBracket] !== ch) {
      stack.push(top);
      return new CorruptedLineResult(lineIndex, text, i, stack);
    }
  }
  return stack.length === 0 ? new CompleteLineResult(lineIndex, text) : new IncompleteLineResult(lineIndex, text, stack);
}
