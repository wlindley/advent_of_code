import type { BracketChar } from '../index';

export interface BracketFamilyStyle {
  readonly family: 'round' | 'square' | 'curly' | 'angle';
  readonly accentVar: string;
  readonly label: string;
}

const ROUND_STYLE: BracketFamilyStyle = { family: 'round', accentVar: 'var(--accent)', label: '()' };
const SQUARE_STYLE: BracketFamilyStyle = { family: 'square', accentVar: 'var(--ok)', label: '[]' };
const CURLY_STYLE: BracketFamilyStyle = { family: 'curly', accentVar: 'var(--gold)', label: '{}' };
const ANGLE_STYLE: BracketFamilyStyle = { family: 'angle', accentVar: 'var(--warn)', label: '<>' };

const STYLE_MAP: Readonly<Record<BracketChar, BracketFamilyStyle>> = {
  '(': ROUND_STYLE,
  ')': ROUND_STYLE,
  '[': SQUARE_STYLE,
  ']': SQUARE_STYLE,
  '{': CURLY_STYLE,
  '}': CURLY_STYLE,
  '<': ANGLE_STYLE,
  '>': ANGLE_STYLE,
};

/** Returns light-mode CSS token styling for a bracket's delimiter family. */
export function getBracketFamilyStyle(ch: BracketChar): BracketFamilyStyle {
  return STYLE_MAP[ch];
}
