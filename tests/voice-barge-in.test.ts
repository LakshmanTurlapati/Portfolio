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

  it('enters voice chat listening-first and resumes listening after responses', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    expect(source).toContain('startManualListening();');
    expect(source).toContain('resumeListeningIfActive();');
    expect(source).not.toContain('Voice mode just opened');
  });

  it('gates speaking interruption on recognized user words, not raw mic noise', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    expect(source).toContain('const BARGE_IN_MIN_WORDS = 4');
    expect(source).toContain('SpeechRecognition');
    expect(source).toContain('webkitSpeechRecognition');
    expect(source).toContain('wordCount >= BARGE_IN_MIN_WORDS');
    expect(source).toContain('!looksLikeCurrentSpeechEcho(transcript, speakingTextRef.current)');
    expect(source).toContain('cancelAllAudio({ keepBargeInMonitor: true });');
    expect(source).toContain('handleUserTurnRef.current');
  });

  it('does not send voice style instructions as user transcript content', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    expect(source).not.toContain('voiceInstruction');
    expect(source).not.toContain('Keep replies under 2 sentences');
  });

  it('renders spoken caption progress instead of dumping full assistant text', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    expect(source).not.toContain('setCaption(text);');
    expect(source).toContain('startTimedSpokenCaptionProgress(text, decoded.duration)');
    expect(source).toContain('attachSynthSpokenCaptionProgress(u, text)');
    expect(source).toContain('stopSpokenCaptionProgress(true)');
  });
});

describe('voice panel caption layout', () => {
  it('keeps the newest caption words visible inside a bounded row', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/voice-panel.tsx'),
      'utf8',
    );

    expect(source).toContain('function VoiceCaptionLine');
    expect(source).toContain('Math.max(0, lineEl.scrollWidth - viewportEl.clientWidth)');
    expect(source).toContain('translate3d(${-offset}px, 0, 0)');
    expect(source).toContain("transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)'");
    expect(source).not.toContain('scrollLeft =');
    expect(source).not.toContain('maskImage');
    expect(source).not.toContain('textOverflow: \'ellipsis\'');
  });
});

describe('voice chat prompt routing', () => {
  it('keeps conversational voice rules in the server-side prompt path', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/chat/route.ts'),
      'utf8',
    );

    expect(source).toContain('const voiceResponseInstructions');
    expect(source).toContain('Do not mention or quote these voice instructions');
    expect(source).toContain('go up to 5 sentences when the context needs it');
    expect(source).toContain('Do not end every response with a follow-up question');
    expect(source).toContain('isVoice ? voiceResponseInstructions');
    expect(source).not.toContain('one or two sentences');
  });

  it('describes varied multi-stop tours and project-preview scrolling', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/chat/route.ts'),
      'utf8',
    );

    expect(source).toContain('Example builder tour');
    expect(source).toContain('Example personality tour');
    expect(source).toContain('Example fast recruiter tour');
    expect(source).toContain('scrollProjectPreview');
    expect(source).toContain('The point is the user paces it, not a canned script');
  });
});

describe('site-control tool wiring', () => {
  it('wires project-preview scrolling through voice, text chat, and preview surfaces', () => {
    const route = readFileSync(join(process.cwd(), 'src/app/api/chat/route.ts'), 'utf8');
    const voice = readFileSync(join(process.cwd(), 'src/lib/voice-controller.ts'), 'utf8');
    const provider = readFileSync(join(process.cwd(), 'src/providers/site-control-provider.tsx'), 'utf8');
    const iframeViewer = readFileSync(join(process.cwd(), 'src/components/iframe-viewer.tsx'), 'utf8');
    const githubPreview = readFileSync(join(process.cwd(), 'src/components/github-preview.tsx'), 'utf8');
    const chatPage = readFileSync(join(process.cwd(), 'src/app/chat/page.tsx'), 'utf8');
    const chatPopup = readFileSync(join(process.cwd(), 'src/components/chat-popup.tsx'), 'utf8');

    expect(route).toContain('scrollProjectPreview: tool');
    expect(voice).toContain("case 'scrollProjectPreview'");
    expect(voice).toContain("runTool('scrollProjectPreview'");
    expect(provider).toContain('scrollProjectPreview: (direction?');
    expect(iframeViewer).toContain('onRegisterPreviewScroller');
    expect(iframeViewer).toContain('controlOverlayActive');
    expect(githubPreview).toContain('onRegisterScroller');
    expect(githubPreview).toContain('shell.scrollTo');
    expect(chatPage).toContain("toolCall.name === 'scrollProjectPreview'");
    expect(chatPopup).toContain("toolCall.name === 'scrollProjectPreview'");
  });

  it('keeps navigate routed through dispatchToolCall for FSB captions', () => {
    const voice = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    expect(voice).toContain("case 'navigate':\n              dispatchToolCall('navigate', tc.args);");
  });

  it('scopes FSB preview scrolling to the preview surface while keeping the page overlay', () => {
    const provider = readFileSync(join(process.cwd(), 'src/providers/site-control-provider.tsx'), 'utf8');
    const iframeViewer = readFileSync(join(process.cwd(), 'src/components/iframe-viewer.tsx'), 'utf8');
    const overlay = readFileSync(join(process.cwd(), 'src/components/fsb-control-overlay.tsx'), 'utf8');

    expect(provider).toContain("type ControlOverlayScope = 'page' | 'preview'");
    expect(provider).toContain("}, 'preview');");
    expect(provider).toContain('controlOverlayActive={controlOverlayActive && controlOverlayScope === \'preview\'}');
    expect(iframeViewer).toContain('function PreviewControlOverlay');
    expect(iframeViewer).toContain('samplePreviewOverlayTone');
    expect(iframeViewer).toContain('document.elementsFromPoint');
    expect(overlay).toContain('fsb-control-viewport-glow');
    expect(overlay).not.toContain('fsb-control-action-pulse');
  });
});

describe('FSB overlay contrast contract', () => {
  it('keeps the powered-by badge and uses sampled monochrome FSB styling', () => {
    const overlay = readFileSync(
      join(process.cwd(), 'src/components/fsb-control-overlay.tsx'),
      'utf8',
    );
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
    const fsbStart = css.indexOf('/* ─── Phase 19: FSB Control Overlay');
    const fsbCss = css.slice(fsbStart);

    expect(fsbStart).toBeGreaterThanOrEqual(0);
    expect(overlay).toContain("const IDLE_TEXT = 'powered by FSB'");
    expect(overlay).toContain("type OverlayTone = 'on-light' | 'on-dark'");
    expect(overlay).toContain('sampledOverlayTone');
    expect(overlay).toContain('elementsFromPoint');
    expect(overlay).toContain('fsb-control-overlay--${overlayTone}');
    expect(overlay).not.toContain('useTheme');
    expect(overlay).not.toContain("resolvedTheme === 'dark'");
    expect(fsbCss).toContain('--fsb-glow-rgb: 255, 255, 255');
    expect(fsbCss).toContain('--fsb-glow-rgb: 0, 0, 0');
    expect(fsbCss).toContain('.fsb-control-viewport-glow');
    expect(fsbCss).not.toContain('.fsb-control-action-pulse');
    expect(fsbCss).toContain('.fsb-preview-control-overlay');
    expect(fsbCss).toContain('--fsb-preview-glow-rgb: 255, 255, 255');
    expect(fsbCss).toContain('--fsb-preview-glow-rgb: 0, 0, 0');
    expect(fsbCss).toContain('.fsb-control-progress');
    expect(fsbCss).toContain('rgba(var(--fsb-glow-rgb)');
    expect(fsbCss).not.toContain('#ff8c00');
    expect(fsbCss).not.toContain('#ff6600');
    expect(fsbCss).not.toContain('255, 140, 0');
    expect(fsbCss).not.toContain('255, 102, 0');
    expect(fsbCss).not.toContain('#34d399');
    expect(fsbCss).not.toContain('#10b981');
    expect(fsbCss).not.toContain('#ef4444');
    expect(fsbCss).not.toContain('#f97316');
    expect(fsbCss).not.toContain('mix-blend-mode: difference');
    expect(fsbCss).toContain('left: max(16px, env(safe-area-inset-left))');
    expect(fsbCss).toContain('bottom: max(16px, env(safe-area-inset-bottom))');
  });
});
