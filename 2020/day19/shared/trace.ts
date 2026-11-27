import { sampleTraceIndices } from '../../../shared/core';
import type { CnfGrammar } from './cnf';
import { matchesMessage } from './cyk';
import { analyzeMessage, type CykAnalysis } from './spans';

export interface MonsterTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly messageIndex: number;
  readonly messageCount: number;
  readonly cumulativeMatches: number;
  readonly analysis: CykAnalysis;
}

function maxMessageLength(messages: readonly string[]): number {
  let maxLen = 0;
  for (const msg of messages) {
    if (msg.length > maxLen) maxLen = msg.length;
  }
  return maxLen;
}

/** Builds up to `maxSteps` sampled trace frames with exact cumulative match counts. */
export function traceMessages(
  cnf: CnfGrammar,
  messages: readonly string[],
  maxSteps: number,
): readonly MonsterTraceFrame[] {
  const indices = sampleTraceIndices(messages.length, maxSteps);
  const maxLen = maxMessageLength(messages);
  const buffer = new Uint32Array(((maxLen * (maxLen + 1)) >>> 1) * cnf.wordCount);
  const frames: MonsterTraceFrame[] = [];
  let cumulativeMatches = 0;
  let samplePos = 0;

  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i]!;
    if (matchesMessage(cnf, msg, buffer)) {
      cumulativeMatches += 1;
    }
    if (indices[samplePos] === i) {
      frames.push(Object.freeze({
        stepIndex: samplePos,
        totalSteps: indices.length,
        messageIndex: i,
        messageCount: messages.length,
        cumulativeMatches,
        analysis: analyzeMessage(cnf, msg),
      }));
      samplePos += 1;
    }
  }
  return Object.freeze(frames);
}
