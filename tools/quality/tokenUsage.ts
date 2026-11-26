import type {
  ModelTierName,
  ModelTierUsage,
  TokenUsageBucket,
  TokenUsageReport,
} from '../../site/data/tokenUsage';

export interface TranscriptUsageChunk {
  readonly tier: ModelTierName;
  readonly turns: number;
  readonly inputTokens: number;
  readonly cacheReadTokens: number;
  readonly outputTokens: number;
}

interface MutableTokenCounts {
  turns: number;
  input: number;
  cache: number;
  output: number;
}

interface RawTranscriptLine {
  readonly type?: string;
  readonly model?: string;
  readonly created_at?: string;
  readonly content?: string;
  readonly input_tokens?: number;
  readonly cache_read_tokens?: number;
  readonly output_tokens?: number;
}

const TIER_ORDER: readonly ModelTierName[] = ['Gemini 4 Neon', 'Gemini Flash', 'Other'];
const YEAR_PATTERNS: readonly RegExp[] = [
  /\.worktrees\/(20\d{2})\//,
  /\.aoc-cache\/(20\d{2})\/day/i,
  /advent_of_code\/(20\d{2})\/day/i,
  /\b(?:AoC|Advent of Code)\s+(20\d{2})\b/i,
  /\b(20\d{2})\s+Day\s+\d+/i,
];

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

export function detectConversationScope(jsonlText: string, isRoot: boolean): string {
  if (isRoot) return 'shared';
  const firstLine = jsonlText.split(/\r?\n/, 1)[0]!;
  if (!firstLine.trim()) return 'shared';
  const entry = JSON.parse(firstLine) as RawTranscriptLine;
  const text = entry.content ?? firstLine;
  for (const pattern of YEAR_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return 'shared';
}

export function toTimeBucket(isoTimestamp: string, bucketMinutes: number): string {
  const ms = Date.parse(isoTimestamp);
  if (Number.isNaN(ms)) return '';
  const stepMs = bucketMinutes * 60_000;
  const floored = Math.floor(ms / stepMs) * stepMs;
  return new Date(floored).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function addUsage(
  map: Map<string, MutableTokenCounts>,
  key: string,
  turns: number,
  input: number,
  cache: number,
  output: number,
): void {
  const bucket = map.get(key) ?? { turns: 0, input: 0, cache: 0, output: 0 };
  bucket.turns += turns;
  bucket.input += input;
  bucket.cache += cache;
  bucket.output += output;
  map.set(key, bucket);
}

export function parseTranscriptUsage(jsonlText: string): readonly TranscriptUsageChunk[] {
  const acc = new Map<string, MutableTokenCounts>();
  for (const line of jsonlText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line) as RawTranscriptLine;
    if (entry.type !== 'PLANNER_RESPONSE') continue;
    const tier = mapModelTier(entry.model ?? '');
    addUsage(acc, tier, 1, entry.input_tokens ?? 0, entry.cache_read_tokens ?? 0, entry.output_tokens ?? 0);
  }
  return [...acc.entries()].map(([tier, b]) => ({
    tier: tier as ModelTierName,
    turns: b.turns,
    inputTokens: b.input,
    cacheReadTokens: b.cache,
    outputTokens: b.output,
  }));
}

export function parseTranscriptTimeline(
  jsonlText: string,
  scope: string,
  bucketMinutes: number,
): readonly TokenUsageBucket[] {
  const acc = new Map<string, { bucketStart: string; tier: ModelTierName; counts: MutableTokenCounts }>();
  for (const line of jsonlText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line) as RawTranscriptLine;
    if (entry.type !== 'PLANNER_RESPONSE') continue;
    const bucketStart = toTimeBucket(entry.created_at ?? '', bucketMinutes);
    if (!bucketStart) continue;
    const tier = mapModelTier(entry.model ?? '');
    const key = `${bucketStart}|${tier}`;
    const existing = acc.get(key) ?? { bucketStart, tier, counts: { turns: 0, input: 0, cache: 0, output: 0 } };
    existing.counts.turns += 1;
    existing.counts.input += entry.input_tokens ?? 0;
    existing.counts.cache += entry.cache_read_tokens ?? 0;
    existing.counts.output += entry.output_tokens ?? 0;
    acc.set(key, existing);
  }
  return [...acc.values()].map((item) => ({
    bucketStart: item.bucketStart,
    scope,
    tier: item.tier,
    turns: item.counts.turns,
    inputTokens: item.counts.input,
    cacheReadTokens: item.counts.cache,
    outputTokens: item.counts.output,
  }));
}

function compareBuckets(a: TokenUsageBucket, b: TokenUsageBucket): number {
  if (a.bucketStart !== b.bucketStart) return a.bucketStart.localeCompare(b.bucketStart);
  if (a.scope !== b.scope) return a.scope.localeCompare(b.scope);
  return TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
}

export function aggregateTokenTimeline(
  buckets: readonly TokenUsageBucket[],
): readonly TokenUsageBucket[] {
  const byKey = new Map<string, { bucketStart: string; scope: string; tier: ModelTierName; counts: MutableTokenCounts }>();
  for (const b of buckets) {
    const key = `${b.bucketStart}|${b.scope}|${b.tier}`;
    const existing = byKey.get(key) ?? {
      bucketStart: b.bucketStart,
      scope: b.scope,
      tier: b.tier,
      counts: { turns: 0, input: 0, cache: 0, output: 0 },
    };
    existing.counts.turns += b.turns;
    existing.counts.input += b.inputTokens;
    existing.counts.cache += b.cacheReadTokens;
    existing.counts.output += b.outputTokens;
    byKey.set(key, existing);
  }
  return [...byKey.values()]
    .map((item) => ({
      bucketStart: item.bucketStart,
      scope: item.scope,
      tier: item.tier,
      turns: item.counts.turns,
      inputTokens: item.counts.input,
      cacheReadTokens: item.counts.cache,
      outputTokens: item.counts.output,
    }))
    .sort(compareBuckets);
}

export function aggregateTokenUsage(
  chunks: readonly TranscriptUsageChunk[],
  subagentsScanned: number,
  budgetTargetTokens: number | null,
  generatedAt: string,
  timeline?: readonly TokenUsageBucket[],
): TokenUsageReport {
  const byTier = new Map<string, MutableTokenCounts>();
  for (const chunk of chunks) {
    addUsage(byTier, chunk.tier, chunk.turns, chunk.inputTokens, chunk.cacheReadTokens, chunk.outputTokens);
  }
  const tiers: ModelTierUsage[] = [];
  for (const tier of TIER_ORDER) {
    const b = byTier.get(tier);
    if (!b) continue;
    tiers.push({ tier, turns: b.turns, inputTokens: b.input, cacheReadTokens: b.cache, outputTokens: b.output });
  }
  if (timeline && timeline.length > 0) {
    return { generatedAt, subagentsScanned, budgetTargetTokens, tiers, timeline: aggregateTokenTimeline(timeline) };
  }
  return { generatedAt, subagentsScanned, budgetTargetTokens, tiers };
}
