import { describe, expect, it } from 'vitest';
import {
  aggregateTokenUsage,
  extractSubagentIds,
  mapModelTier,
  parseTranscriptUsage,
} from './tokenUsage';

describe('transcript token usage parser', () => {
  it('maps model names into friendly tiers', () => {
    expect(mapModelTier('gemini-4-neon-high')).toBe('Gemini 4 Neon');
    expect(mapModelTier('gemini-pro')).toBe('Gemini 4 Neon');
    expect(mapModelTier('gemini-flash')).toBe('Gemini Flash');
    expect(mapModelTier('gemini-4-hydrogen-tiered-high')).toBe('Gemini Flash');
    expect(mapModelTier('custom-model')).toBe('Other');
  });

  it('extracts subagent IDs and aggregates PLANNER_RESPONSE token usage', () => {
    const idA = '11111111-1111-1111-1111-111111111111';
    const idB = '22222222-2222-2222-2222-222222222222';
    const jsonl = [
      JSON.stringify({ type: 'USER_INPUT', content: `brain/${idA}/log` }),
      JSON.stringify({ type: 'PLANNER_RESPONSE', model: 'gemini-4-neon-high', input_tokens: 1000, cache_read_tokens: 5000, output_tokens: 200 }),
      JSON.stringify({ type: 'PLANNER_RESPONSE', model: 'gemini-4-hydrogen-tiered-high', input_tokens: 400, output_tokens: 100 }),
      JSON.stringify({ type: 'PLANNER_RESPONSE', content: `"conversationId":"${idB}"` }),
      '',
    ].join('\n');

    expect([...extractSubagentIds(jsonl)].sort()).toEqual([idA, idB]);
    const chunks = parseTranscriptUsage(jsonl);
    const report = aggregateTokenUsage([...chunks, ...chunks], 2, 50_000, '2026-11-26T00:00:00Z');
    expect(report.subagentsScanned).toBe(2);
    expect(report.budgetTargetTokens).toBe(50_000);
    expect(report.tiers).toEqual([
      { tier: 'Gemini 4 Neon', turns: 2, inputTokens: 2000, cacheReadTokens: 10000, outputTokens: 400 },
      { tier: 'Gemini Flash', turns: 2, inputTokens: 800, cacheReadTokens: 0, outputTokens: 200 },
      { tier: 'Other', turns: 2, inputTokens: 0, cacheReadTokens: 0, outputTokens: 0 },
    ]);
    expect(aggregateTokenUsage([], 0, null, '2026-11-26T00:00:00Z').tiers).toEqual([]);
  });
});
