import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import type { TokenUsageBucket } from '../../site/data/tokenUsage';
import {
  aggregateTokenUsage,
  detectConversationScope,
  extractSubagentIds,
  parseTranscriptTimeline,
  parseTranscriptUsage,
  type TranscriptUsageChunk,
} from './tokenUsage';

interface TokenConfig {
  readonly rootConversationIds: readonly string[];
  readonly budgetTargetTokens: number | null;
}

const TIMELINE_BUCKET_MINUTES = 30;
const rootDir = resolve(process.cwd());
const configPath = join(rootDir, 'site', 'data', 'tokenConfig.json');
const config = JSON.parse(readFileSync(configPath, 'utf8')) as TokenConfig;
const brainDir = join(homedir(), '.gemini', 'antigravity', 'brain');
const rootSet = new Set(config.rootConversationIds);

const visited = new Set<string>();
const queue = [...config.rootConversationIds];
const allChunks: TranscriptUsageChunk[] = [];
const allBuckets: TokenUsageBucket[] = [];

for (let head = 0; head < queue.length; head += 1) {
  const id = queue[head]!;
  if (visited.has(id)) continue;
  visited.add(id);
  const logPath = join(brainDir, id, '.system_generated', 'logs', 'transcript.jsonl');
  if (!existsSync(logPath)) continue;
  const text = readFileSync(logPath, 'utf8');
  const scope = detectConversationScope(text, rootSet.has(id));
  allChunks.push(...parseTranscriptUsage(text));
  allBuckets.push(...parseTranscriptTimeline(text, scope, TIMELINE_BUCKET_MINUTES));
  for (const childId of extractSubagentIds(text)) {
    if (!visited.has(childId)) queue.push(childId);
  }
}

const subagentsScanned = Math.max(0, visited.size - config.rootConversationIds.length);
const report = aggregateTokenUsage(
  allChunks,
  subagentsScanned,
  config.budgetTargetTokens,
  new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  allBuckets,
);
const outputPath = join(rootDir, 'site', 'data', 'tokenUsage.json');
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(
  `Wrote ${outputPath}: ${visited.size} conversations (${subagentsScanned} subagents, ${report.timeline?.length ?? 0} timeline buckets)`,
);
