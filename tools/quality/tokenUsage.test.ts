import { describe, expect, it } from 'vitest';
import {
  aggregateTokenTimeline,
  aggregateTokenUsage,
  detectConversationScope,
  extractSubagentIds,
  mapModelTier,
  parseTranscriptTimeline,
  parseTranscriptUsage,
  toTimeBucket,
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

  it('detects conversation year scope and falls back to shared', () => {
    expect(detectConversationScope(JSON.stringify({ content: 'AoC 2024 Day 10' }), true)).toBe('shared');
    expect(detectConversationScope('', false)).toBe('shared');
    expect(detectConversationScope(JSON.stringify({ content: 'Worktree .worktrees/2023/2023/day05' }), false)).toBe('2023');
    expect(detectConversationScope(JSON.stringify({ content: 'Analyze Advent of Code 2025 Day 1' }), false)).toBe('2025');
    expect(detectConversationScope(JSON.stringify({ content: 'Review 2022 Day 24 Part 2' }), false)).toBe('2022');
    expect(detectConversationScope(JSON.stringify({ type: 'SYSTEM_MESSAGE' }), false)).toBe('shared');
    expect(detectConversationScope(JSON.stringify({ content: 'Refactor shared utilities' }), false)).toBe('shared');
  });

  it('buckets timestamps and aggregates sorted per-scope token timelines', () => {
    expect(toTimeBucket('2026-11-26T17:44:19Z', 30)).toBe('2026-11-26T17:30:00Z');
    expect(toTimeBucket('2026-11-26T17:12:00Z', 30)).toBe('2026-11-26T17:00:00Z');
    expect(toTimeBucket('not-a-date', 30)).toBe('');

    const jsonl = [
      JSON.stringify({ type: 'SYSTEM_MESSAGE', created_at: '2026-11-26T17:31:00Z' }),
      JSON.stringify({ type: 'PLANNER_RESPONSE', model: 'gemini-4-neon-high', created_at: '2026-11-26T17:31:00Z', input_tokens: 100, cache_read_tokens: 500, output_tokens: 50 }),
      JSON.stringify({ type: 'PLANNER_RESPONSE', model: 'gemini-4-neon-high', created_at: '2026-11-26T17:45:00Z', input_tokens: 200, output_tokens: 25 }),
      JSON.stringify({ type: 'PLANNER_RESPONSE', model: 'gemini-flash', created_at: '2026-11-26T17:10:00Z' }),
      JSON.stringify({ type: 'PLANNER_RESPONSE', model: 'gemini-flash' }),
      '',
    ].join('\n');

    const b1 = parseTranscriptTimeline(jsonl, '2024', 30);
    const b2 = parseTranscriptTimeline(
      JSON.stringify({ type: 'PLANNER_RESPONSE', created_at: '2026-11-26T17:35:00Z', input_tokens: 10 }),
      '2023',
      30,
    );
    const b3 = parseTranscriptTimeline(
      JSON.stringify({ type: 'PLANNER_RESPONSE', created_at: '2026-11-26T17:35:00Z', input_tokens: 5 }),
      'shared',
      30,
    );
    const merged = aggregateTokenTimeline([...b3, ...b1, ...b1, ...b2]);
    expect(merged).toEqual([
      { bucketStart: '2026-11-26T17:00:00Z', scope: '2024', tier: 'Gemini Flash', turns: 2, inputTokens: 0, cacheReadTokens: 0, outputTokens: 0 },
      { bucketStart: '2026-11-26T17:30:00Z', scope: '2023', tier: 'Other', turns: 1, inputTokens: 10, cacheReadTokens: 0, outputTokens: 0 },
      { bucketStart: '2026-11-26T17:30:00Z', scope: '2024', tier: 'Gemini 4 Neon', turns: 4, inputTokens: 600, cacheReadTokens: 1000, outputTokens: 150 },
      { bucketStart: '2026-11-26T17:30:00Z', scope: 'shared', tier: 'Other', turns: 1, inputTokens: 5, cacheReadTokens: 0, outputTokens: 0 },
    ]);

    const withTimeline = aggregateTokenUsage([], 1, null, '2026-11-26T18:00:00Z', [
      { bucketStart: '2026-11-26T17:30:00Z', scope: '2024', tier: 'Gemini Flash', turns: 1, inputTokens: 10, cacheReadTokens: 0, outputTokens: 5 },
      { bucketStart: '2026-11-26T17:30:00Z', scope: '2024', tier: 'Gemini 4 Neon', turns: 1, inputTokens: 20, cacheReadTokens: 0, outputTokens: 5 },
    ]);
    expect(withTimeline.timeline?.map((b) => b.tier)).toEqual(['Gemini 4 Neon', 'Gemini Flash']);
  });
});
