import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  aggregateTokenUsage,
  extractSubagentIds,
  parseTranscriptUsage,
  type TranscriptUsageChunk,
} from './tokenUsage';

interface TokenConfig {
  readonly rootConversationIds: readonly string[];
  readonly budgetTargetTokens: number | null;
}

const rootDir = resolve(process.cwd());
const configPath = join(rootDir, 'site', 'data', 'tokenConfig.json');
const config = JSON.parse(readFileSync(configPath, 'utf8')) as TokenConfig;
const brainDir = join(homedir(), '.gemini', 'antigravity', 'brain');

const visited = new Set<string>();
const queue = [...config.rootConversationIds];
const allChunks: TranscriptUsageChunk[] = [];

for (let head = 0; head < queue.length; head += 1) {
  const id = queue[head]!;
  if (visited.has(id)) continue;
  visited.add(id);
  const logPath = join(brainDir, id, '.system_generated', 'logs', 'transcript.jsonl');
  if (!existsSync(logPath)) continue;
  const text = readFileSync(logPath, 'utf8');
  allChunks.push(...parseTranscriptUsage(text));
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
);
const outputPath = join(rootDir, 'site', 'data', 'tokenUsage.json');
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}: ${visited.size} conversations (${subagentsScanned} subagents)`);
