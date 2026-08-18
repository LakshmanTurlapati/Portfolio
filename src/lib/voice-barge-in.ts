interface VoiceBargeInOptions {
  warmupMs?: number;
  sustainMs?: number;
  cooldownMs?: number;
  minRms?: number;
  noiseMultiplier?: number;
  noiseOffset?: number;
}

interface VoiceBargeInSample {
  rms: number;
  nowMs: number;
}

const DEFAULT_BARGE_IN_OPTIONS = {
  warmupMs: 700,
  sustainMs: 220,
  cooldownMs: 1200,
  minRms: 0.035,
  noiseMultiplier: 3.2,
  noiseOffset: 0.02,
} as const satisfies Required<VoiceBargeInOptions>;

export class VoiceBargeInDetector {
  private readonly options: Required<VoiceBargeInOptions>;
  private startedAtMs: number | null = null;
  private aboveSinceMs: number | null = null;
  private lastTriggerMs = Number.NEGATIVE_INFINITY;
  private noiseFloor = 0;

  constructor(options: VoiceBargeInOptions = {}) {
    this.options = { ...DEFAULT_BARGE_IN_OPTIONS, ...options };
  }

  reset(nowMs = 0): void {
    this.startedAtMs = nowMs;
    this.aboveSinceMs = null;
    this.noiseFloor = 0;
  }

  sample({ rms, nowMs }: VoiceBargeInSample): boolean {
    if (this.startedAtMs === null) this.reset(nowMs);

    const elapsed = nowMs - this.startedAtMs!;
    if (elapsed < this.options.warmupMs) {
      this.updateNoiseFloor(rms, 0.2);
      return false;
    }

    const threshold = Math.max(
      this.options.minRms,
      this.noiseFloor * this.options.noiseMultiplier,
      this.noiseFloor + this.options.noiseOffset,
    );

    if (rms <= threshold) {
      this.aboveSinceMs = null;
      this.updateNoiseFloor(rms, 0.04);
      return false;
    }

    this.aboveSinceMs ??= nowMs;
    if (
      nowMs - this.aboveSinceMs >= this.options.sustainMs &&
      nowMs - this.lastTriggerMs >= this.options.cooldownMs
    ) {
      this.lastTriggerMs = nowMs;
      this.aboveSinceMs = null;
      return true;
    }

    return false;
  }

  private updateNoiseFloor(rms: number, alpha: number): void {
    if (this.noiseFloor === 0) {
      this.noiseFloor = rms;
      return;
    }
    this.noiseFloor += (rms - this.noiseFloor) * alpha;
  }
}

export function calculateRms(buffer: Uint8Array): number {
  if (buffer.length === 0) return 0;

  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = (buffer[i] - 128) / 128;
    sum += v * v;
  }

  return Math.sqrt(sum / buffer.length);
}
