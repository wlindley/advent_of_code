import { decodeDotSheet } from './bitmapFont';
import type { DotSheet, OrigamiManual } from './models';

/** Strategy selecting how many folds to apply and how to extract the final answer. */
export interface OrigamiPolicy<TAnswer> {
  readonly name: string;
  readonly answerLabel: string;
  foldCount(manual: OrigamiManual): number;
  extractAnswer(sheet: DotSheet): TAnswer;
}

/** Part 1 policy: apply only the first fold and count visible dots. */
export const FIRST_FOLD_COUNT_POLICY: OrigamiPolicy<number> = Object.freeze({
  name: 'First Fold',
  answerLabel: 'Visible Dots',
  foldCount: (): number => 1,
  extractAnswer: (sheet: DotSheet): number => sheet.dotCount,
});

/** Part 2 policy: apply all folds and decode the 5x6 bitmap activation code. */
export const ALL_FOLDS_CODE_POLICY: OrigamiPolicy<string> = Object.freeze({
  name: 'All Folds',
  answerLabel: 'Activation Code',
  foldCount: (manual: OrigamiManual): number => manual.foldCount,
  extractAnswer: (sheet: DotSheet): string => decodeDotSheet(sheet),
});
