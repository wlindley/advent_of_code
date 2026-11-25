export interface VersionMonitorOptions {
  readonly currentBuildId: string;
  readonly fetchBuildId: () => Promise<string | null>;
  readonly onUpdate: () => void;
  readonly isReloadSafe?: () => boolean;
}

export class VersionMonitor {
  private pending = false;
  private triggered = false;

  constructor(private readonly options: VersionMonitorOptions) {}

  get hasPendingUpdate(): boolean {
    return this.pending;
  }

  async checkNow(): Promise<boolean> {
    if (this.triggered) return false;
    let remoteBuildId: string | null;
    try {
      remoteBuildId = await this.options.fetchBuildId();
    } catch {
      return false;
    }
    if (!remoteBuildId || remoteBuildId === this.options.currentBuildId) return false;

    this.pending = true;
    this.flushPending();
    return true;
  }

  flushPending(): boolean {
    if (!this.pending || this.triggered) return false;
    if (this.options.isReloadSafe && !this.options.isReloadSafe()) return false;
    this.pending = false;
    this.triggered = true;
    this.options.onUpdate();
    return true;
  }
}
