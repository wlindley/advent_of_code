import { describe, expect, it } from 'vitest';
import { VersionMonitor } from './versionMonitor';

describe('VersionMonitor', () => {
  it('does not trigger update when remote buildId matches current buildId', async () => {
    let reloads = 0;
    const monitor = new VersionMonitor({
      currentBuildId: 'build-1',
      fetchBuildId: async () => 'build-1',
      onUpdate: () => { reloads += 1; },
    });

    expect(await monitor.checkNow()).toBe(false);
    expect(reloads).toBe(0);
    expect(monitor.hasPendingUpdate).toBe(false);
  });

  it('triggers onUpdate once when a newer buildId is detected', async () => {
    let reloads = 0;
    const monitor = new VersionMonitor({
      currentBuildId: 'build-1',
      fetchBuildId: async () => 'build-2',
      onUpdate: () => { reloads += 1; },
    });

    expect(await monitor.checkNow()).toBe(true);
    expect(await monitor.checkNow()).toBe(false);
    expect(reloads).toBe(1);
  });

  it('defers reload when unsafe and flushes once safe', async () => {
    let safe = false;
    let reloads = 0;
    const monitor = new VersionMonitor({
      currentBuildId: 'build-1',
      fetchBuildId: async () => 'build-2',
      isReloadSafe: () => safe,
      onUpdate: () => { reloads += 1; },
    });

    expect(await monitor.checkNow()).toBe(true);
    expect(reloads).toBe(0);
    expect(monitor.hasPendingUpdate).toBe(true);
    expect(monitor.flushPending()).toBe(false);

    safe = true;
    expect(monitor.flushPending()).toBe(true);
    expect(reloads).toBe(1);
    expect(monitor.hasPendingUpdate).toBe(false);
    expect(monitor.flushPending()).toBe(false);
  });

  it('swallows transient fetch errors and empty responses cleanly', async () => {
    let reloads = 0;
    const failing = new VersionMonitor({
      currentBuildId: 'build-1',
      fetchBuildId: async () => { throw new Error('offline'); },
      onUpdate: () => { reloads += 1; },
    });
    const empty = new VersionMonitor({
      currentBuildId: 'build-1',
      fetchBuildId: async () => null,
      onUpdate: () => { reloads += 1; },
    });

    expect(await failing.checkNow()).toBe(false);
    expect(await empty.checkNow()).toBe(false);
    expect(reloads).toBe(0);
  });
});
