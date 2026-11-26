import type { ModelTierName, ModelTierUsage, TokenUsageReport } from '../../site/data/tokenUsage';

export interface TranscriptUsageChunk {
  readonly tier: ModelTierName;
  readonly turns: number;
  readonly inputTokens: number;
  readonly cacheReadTokens: number;
  readonly outputTokens: number;
}

const TIER_ORDER: readonly ModelTierName[] = ['Gemini 4 Neon', 'Gemini Flash', 'Other'];

export function mapModelTier(rawModel: string): ModelTierName {
  const lower = rawModel.toLowerCase();
  if (lower.includes('neon') || lower.includes('pro')) return 'Gemini 4 Neon';
  if (lower.includes('flash') || lower.includes('hydrogen')) return 'Gemini Flash';
  return 'Other';
}

export function extractSubagentIds(jsonlText: string): readonly string[] {
  const ids = new Set<string>();
  for (const m of jsonlText.matchAll(/\\?"conversationId\\?"\s*:\s*\\?"([0-9a-f-]{36})\\?"/g)) {
    ids.add(m[1]!);
  }
  for (const m of jsonlText.matchAll(/brain\/([0-9a-f-]{36})\//g)) {
    ids.add(m[1]!);
  }
  return [...ids];
}

export function parseTranscriptUsage(jsonlText: string): readonly TranscriptUsageChunk[] {
  const acc = new Map<ModelTierName, { turns: number; input: number; cache: number; output: number }>();
  for (const line of jsonlText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line) as {
      type?: string;
      model?: string;
      input_tokens?: number;
      cache_read_tokens?: number;
      output_tokens?: number;
    };
    if (entry.type !== 'PLANNER_RESPONSE') continue;
    const tier = mapModelTier(entry.model ?? '');
    const bucket = acc.get(tier) ?? { turns: 0, input: 0, cache: 0, output: 0 };
    bucket.turns += 1;
    bucket.input += entry.input_tokens ?? 0;
    bucket.cache += entry.cache_read_tokens ?? 0;
    bucket.output += entry.output_tokens ?? 0;
    acc.set(tier, bucket);
  }
  return [...acc.entries()].map(([tier, b]) => ({
    tier,
    turns: b.turns,
    inputTokens: b.input,
    cacheReadTokens: b.cache,
    outputTokens: b.output,
  }));
}

export function aggregateTokenUsage(
  chunks: readonly TranscriptUsageChunk[],
  subagentsScanned: number,
  budgetTargetTokens: number | null,
  generatedAt: string,
): TokenUsageReport {
  const byTier = new Map<ModelTierName, { turns: number; input: number; cache: number; output: number }>();
  for (const chunk of chunks) {
    const bucket = byTier.get(chunk.tier) ?? { turns: 0, input: 0, cache: 0, output: 0 };
    bucket.turns += chunk.turns;
    bucket.input += chunk.inputTokens;
    bucket.cache += chunk.cacheReadTokens;
    bucket.output += chunk.outputTokens;
    byTier.set(chunk.tier, bucket);
  }
  const tiers: ModelTierUsage[] = [];
  for (const tier of TIER_ORDER) {
    const b = byTier.get(tier);
    if (!b) continue;
    tiers.push({
      tier,
      turns: b.turns,
      inputTokens: b.input,
      cacheReadTokens: b.cache,
      outputTokens: b.output,
    });
  }
  return { generatedAt, subagentsScanned, budgetTargetTokens, tiers };
}
