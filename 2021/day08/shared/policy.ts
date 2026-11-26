import type { DecodedDigit, DecodedDisplay } from './wiring';

export type DisplayPolicyId = 'unique-digits' | 'decoded-output-sum';

/** Strategy interface scoring decoded 4-digit displays for Part 1 vs Part 2. */
export interface DisplayEvaluationPolicy {
  readonly id: DisplayPolicyId;
  readonly label: string;
  readonly contributionLabel: string;
  readonly totalLabel: string;
  evaluate(display: DecodedDisplay): number;
  highlightsDigit(digit: DecodedDigit): boolean;
}

/** Part 1 policy counting output digits with unique segment counts (1, 4, 7, 8). */
export class UniqueDigitsPolicy implements DisplayEvaluationPolicy {
  readonly id = 'unique-digits' as const;
  readonly label = 'Unique Digits (1, 4, 7, 8)';
  readonly contributionLabel = 'Entry Unique';
  readonly totalLabel = 'Total Unique Digits';

  evaluate(display: DecodedDisplay): number {
    return display.uniqueDigitCount;
  }

  highlightsDigit(digit: DecodedDigit): boolean {
    return digit.isUniqueSegmentCount;
  }
}

/** Part 2 policy summing full 4-digit decoded display values. */
export class DecodedOutputSumPolicy implements DisplayEvaluationPolicy {
  readonly id = 'decoded-output-sum' as const;
  readonly label = 'Full Decoded Output Sum';
  readonly contributionLabel = 'Entry Value';
  readonly totalLabel = 'Output Sum';

  evaluate(display: DecodedDisplay): number {
    return display.outputValue;
  }

  highlightsDigit(_digit: DecodedDigit): boolean {
    return true;
  }
}

export const UNIQUE_DIGITS_POLICY: DisplayEvaluationPolicy = Object.freeze(new UniqueDigitsPolicy());
export const DECODED_OUTPUT_SUM_POLICY: DisplayEvaluationPolicy = Object.freeze(
  new DecodedOutputSumPolicy(),
);
