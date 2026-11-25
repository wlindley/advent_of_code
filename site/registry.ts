import { formatPartKey } from '../shared/core';
import type { PuzzlePartManifest } from '../shared/viz';

interface ManifestModule {
  readonly manifest?: PuzzlePartManifest;
}

// Auto-discover every solved puzzle part manifest at build time.
const modules = import.meta.glob<ManifestModule>('/[0-9][0-9][0-9][0-9]/day*/part*/index.ts', {
  eager: true,
});

const manifestMap = new Map<string, PuzzlePartManifest>();
for (const mod of Object.values(modules)) {
  if (!mod.manifest) continue;
  const { year, day, part } = mod.manifest.meta;
  manifestMap.set(formatPartKey(year, day, part), mod.manifest);
}

export function getPartManifest(year: number, day: number, part: 1 | 2): PuzzlePartManifest | undefined {
  return manifestMap.get(formatPartKey(year, day, part));
}
