import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculateRms, VoiceBargeInDetector } from '@/lib/voice-barge-in';

describe('voice barge-in detector', () => {
  it('does not trigger during warmup', () => {
    const detector = new VoiceBargeInDetector();
    detector.reset(0);

    expect(detector.sample({ rms: 1, nowMs: 699 })).toBe(false);
  });

  it('does not trigger for noise-floor audio', () => {
    const detector = new VoiceBargeInDetector();
    detector.reset(0);

    expect(detector.sample({ rms: 0.006, nowMs: 0 })).toBe(false);
    expect(detector.sample({ rms: 0.007, nowMs: 300 })).toBe(false);
    expect(detector.sample({ rms: 0.009, nowMs: 750 })).toBe(false);
    expect(detector.sample({ rms: 0.012, nowMs: 1200 })).toBe(false);
  });

  it('triggers only after sustained above-threshold speech', () => {
    const detector = new VoiceBargeInDetector();
    detector.reset(0);

    detector.sample({ rms: 0.006, nowMs: 0 });
    detector.sample({ rms: 0.007, nowMs: 500 });

    expect(detector.sample({ rms: 0.12, nowMs: 800 })).toBe(false);
    expect(detector.sample({ rms: 0.12, nowMs: 900 })).toBe(false);
    expect(detector.sample({ rms: 0.12, nowMs: 1020 })).toBe(true);
  });

  it('enforces cooldown after a trigger', () => {
    const detector = new VoiceBargeInDetector();
    detector.reset(0);

    detector.sample({ rms: 0.006, nowMs: 0 });
    detector.sample({ rms: 0.12, nowMs: 800 });
    expect(detector.sample({ rms: 0.12, nowMs: 1020 })).toBe(true);

    expect(detector.sample({ rms: 0.12, nowMs: 1300 })).toBe(false);
    expect(detector.sample({ rms: 0.12, nowMs: 2000 })).toBe(false);
    expect(detector.sample({ rms: 0.12, nowMs: 2300 })).toBe(true);
  });

  it('calculates normalized PCM RMS from analyser bytes', () => {
    expect(calculateRms(new Uint8Array([128, 128, 128]))).toBe(0);
    expect(calculateRms(new Uint8Array([0, 255]))).toBeGreaterThan(0.99);
  });
});

describe('voice-controller barge-in wiring', () => {
  it('does not subscribe barge-in to the shared VoiceBus level stream', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    expect(source).not.toContain("VoiceBus.on('level'");
    expect(source).not.toContain('VoiceBus.on("level"');
  });
});
