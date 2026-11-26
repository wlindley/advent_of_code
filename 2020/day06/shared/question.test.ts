import { describe, expect, it } from 'vitest';
import {
  ALL_QUESTIONS_MASK,
  CHAR_CODE_A,
  QUESTION_COUNT,
  QUESTION_LETTERS,
  assertValidQuestionIndex,
  assertValidQuestionMask,
  encodeAnswerLine,
  formatQuestionMask,
  hasQuestion,
  popcount26,
  questionBit,
} from './question';

describe('2020 day06 question bitmask primitives', () => {
  it('exposes frozen 26-letter constants', () => {
    expect(QUESTION_COUNT).toBe(26);
    expect(CHAR_CODE_A).toBe(97);
    expect(ALL_QUESTIONS_MASK).toBe(0x3ffffff);
    expect(Object.isFrozen(QUESTION_LETTERS)).toBe(true);
    expect(QUESTION_LETTERS.join('')).toBe('abcdefghijklmnopqrstuvwxyz');
  });

  it('validates question indices and computes single-question bits', () => {
    expect(questionBit(0)).toBe(1);
    expect(questionBit(25)).toBe(1 << 25);
    expect(() => assertValidQuestionIndex(-1)).toThrow(RangeError);
    expect(() => assertValidQuestionIndex(26)).toThrow(RangeError);
    expect(() => assertValidQuestionIndex(1.5)).toThrow(RangeError);
    expect(() => questionBit(26)).toThrow(RangeError);
  });

  it('validates question masks and checks individual bits', () => {
    expect(hasQuestion(0b101, 0)).toBe(true);
    expect(hasQuestion(0b101, 1)).toBe(false);
    expect(hasQuestion(ALL_QUESTIONS_MASK, 25)).toBe(true);
    expect(() => assertValidQuestionMask(-1)).toThrow(RangeError);
    expect(() => assertValidQuestionMask(ALL_QUESTIONS_MASK + 1)).toThrow(RangeError);
    expect(() => assertValidQuestionMask(3.14)).toThrow(RangeError);
    expect(() => hasQuestion(-1, 0)).toThrow(RangeError);
    expect(() => hasQuestion(1, 26)).toThrow(RangeError);
  });

  it('computes exact popcount26 via SWAR across edge masks', () => {
    expect(popcount26(0)).toBe(0);
    expect(popcount26(1)).toBe(1);
    expect(popcount26(0b1010101)).toBe(4);
    expect(popcount26(ALL_QUESTIONS_MASK)).toBe(26);
    expect(() => popcount26(ALL_QUESTIONS_MASK + 1)).toThrow(RangeError);
  });

  it('encodes raw answer lines without trimming and rejects invalid inputs', () => {
    expect(encodeAnswerLine('abc')).toBe(0b111);
    expect(encodeAnswerLine('zya')).toBe((1 << 25) | (1 << 24) | 1);
    expect(encodeAnswerLine('aaa')).toBe(1);
    expect(() => encodeAnswerLine('')).toThrow(SyntaxError);
    expect(() => encodeAnswerLine('A')).toThrow(SyntaxError);
    expect(() => encodeAnswerLine(' a')).toThrow(SyntaxError);
    expect(() => encodeAnswerLine('a{')).toThrow(SyntaxError);
  });

  it('formats valid question masks as sorted lowercase letters', () => {
    expect(formatQuestionMask(0)).toBe('');
    expect(formatQuestionMask(0b101)).toBe('ac');
    expect(formatQuestionMask(ALL_QUESTIONS_MASK)).toBe('abcdefghijklmnopqrstuvwxyz');
    expect(() => formatQuestionMask(-1)).toThrow(RangeError);
  });
});
