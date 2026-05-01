import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculateRms, VoiceBargeInDetector } from '@/lib/voice-barge-in';
import { parseVoiceStreamLine, type VoiceStreamParseState } from '@/lib/voice-controller';
import {
  buildVoiceOpeningPrompt,
  isExplicitTourIntent,
  isIntentionalBargeInTranscript,
  isMobileIntentionalBargeInTranscript,
  looksLikeCurrentSpeechEcho,
  shouldPersistVoiceTurn,
  VOICE_BARGE_IN_MIN_WORDS,
  VOICE_MOBILE_BARGE_IN_MIN_WORDS,
  VOICE_MOBILE_INTERIM_BARGE_IN_MIN_WORDS,
} from '@/lib/voice-turn-policy';

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

describe('voice turn policy', () => {
  it('uses three recognized words as the barge-in threshold', () => {
    expect(VOICE_BARGE_IN_MIN_WORDS).toBe(3);
    expect(isIntentionalBargeInTranscript('wait please', 'Parz is speaking')).toBe(false);
    expect(isIntentionalBargeInTranscript('wait please stop', 'Parz is speaking')).toBe(true);
  });

  it('rejects current TTS echo as a barge-in transcript', () => {
    const currentSpeech = 'Sure, I can show you the portfolio page first.';

    expect(looksLikeCurrentSpeechEcho('show you the portfolio', currentSpeech)).toBe(true);
    expect(isIntentionalBargeInTranscript('show you the portfolio', currentSpeech)).toBe(false);
  });

  it('rejects fuzzy current TTS echoes with dropped words', () => {
    const currentSpeech = 'Alright, here is the long version. This is not a static resume wall.';

    expect(looksLikeCurrentSpeechEcho('here is long version this is static resume', currentSpeech)).toBe(true);
    expect(isIntentionalBargeInTranscript('long version static resume wall', currentSpeech)).toBe(false);
    expect(isIntentionalBargeInTranscript('actually tell me about GitFly', currentSpeech)).toBe(true);
  });

  it('requires stronger mobile barge-in transcripts during speech', () => {
    const currentSpeech = 'Sure, I can show you the portfolio page first.';

    expect(VOICE_MOBILE_BARGE_IN_MIN_WORDS).toBe(4);
    expect(VOICE_MOBILE_INTERIM_BARGE_IN_MIN_WORDS).toBe(5);
    expect(isMobileIntentionalBargeInTranscript('wait please stop', currentSpeech, true)).toBe(false);
    expect(isMobileIntentionalBargeInTranscript('wait please stop now', currentSpeech, true)).toBe(true);
    expect(isMobileIntentionalBargeInTranscript('wait please stop now', currentSpeech, false)).toBe(false);
    expect(isMobileIntentionalBargeInTranscript('wait stop for a second', currentSpeech, false)).toBe(true);
    expect(isMobileIntentionalBargeInTranscript('can show portfolio page first', currentSpeech, false)).toBe(false);
    expect(isMobileIntentionalBargeInTranscript('actually tell me about GitFly', currentSpeech, false)).toBe(true);
  });

  it('builds a synthetic first-turn prompt without treating it as user history', () => {
    expect(buildVoiceOpeningPrompt('portfolio')).toContain('portfolio page');
    expect(shouldPersistVoiceTurn('greet')).toBe(false);
    expect(shouldPersistVoiceTurn('user')).toBe(true);
  });

  it('recognizes explicit tour requests without treating normal questions as tours', () => {
    expect(isExplicitTourIntent('give me a tour')).toBe(true);
    expect(isExplicitTourIntent('walk me through the portfolio')).toBe(true);
    expect(isExplicitTourIntent('show me around')).toBe(true);
    expect(isExplicitTourIntent('start the guided tour')).toBe(true);
    expect(isExplicitTourIntent('showcase the projects')).toBe(true);

    expect(isExplicitTourIntent('tell me about Review Gate')).toBe(false);
    expect(isExplicitTourIntent('what projects are you proud of')).toBe(false);
    expect(isExplicitTourIntent('what can you do')).toBe(false);
    expect(isExplicitTourIntent(buildVoiceOpeningPrompt('home'))).toBe(false);
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

  it('opens voice chat by speaking first, then resumes listening after responses', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    expect(source).toContain('buildVoiceOpeningPrompt(currentPage ?? \'home\')');
    expect(source).toContain("handleUserTurn(trigger, { kind: 'greet' })");
    expect(source).toContain('resumeListeningIfActive();');
    expect(source).not.toContain('startManualListening();\n  }, [startManualListening]');
  });

  it('does not silently restart listening after empty voice responses or API failures', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    const emptyResponseIndex = source.indexOf(
      `setCaption("I couldn't get a spoken response. Tap to try again.");`,
    );
    const failureIndex = source.indexOf(
      "setCaption('Voice connection hiccup. Tap to try again.');",
    );

    expect(emptyResponseIndex).toBeGreaterThan(-1);
    expect(failureIndex).toBeGreaterThan(-1);

    const emptyResponseBlock = source.slice(
      emptyResponseIndex,
      source.indexOf('      } catch {', emptyResponseIndex),
    );
    const failureBlock = source.slice(
      failureIndex,
      source.indexOf('    },', failureIndex),
    );

    expect(emptyResponseBlock).not.toContain('resumeListeningIfActive();');
    expect(failureBlock).not.toContain('resumeListeningIfActive();');
  });

  it('bounds chat and TTS waits so voice cannot hang after a turn', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    expect(source).toContain('const VOICE_CHAT_RESPONSE_TIMEOUT_MS = 35000');
    expect(source).toContain('const VOICE_TTS_PLAYBACK_GUARD_BUFFER_MS = 1750');
    expect(source).toContain('const chatAbortRef = useRef<AbortController | null>(null)');
    expect(source).toContain('const chatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)');
    expect(source).toContain('const audioPlaybackGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null)');
    expect(source).toContain('const abortActiveChatRequest = () => {');
    expect(source).toContain('signal: chatAc.signal');
    expect(source).toContain('setTimeout(() => chatAc.abort(), VOICE_CHAT_RESPONSE_TIMEOUT_MS)');
    expect(source).toContain('if (ctx.state === \'suspended\')');
    expect(source).toContain("throw new Error('AudioContext still suspended')");
    expect(source).toContain('audioPlaybackGuardRef.current = setTimeout(() => {');
    expect(source).toContain('finishBufferPlayback();');
    expect(source).toContain('VOICE_TTS_PLAYBACK_GUARD_BUFFER_MS');
  });

  it('clears tour transcript before handing control back to listening', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );
    const tourBlockStart = source.indexOf('const startGuidedTour = useCallback');
    const tourBlock = source.slice(tourBlockStart, source.indexOf('// handleUserTurn', tourBlockStart));

    expect(tourBlock).toContain("window.VoiceBus.setState('idle');");
    expect(tourBlock).toContain("setCaption('');");
    expect(tourBlock).toContain("setTranscript('');");
    expect(tourBlock).toContain('resumeListeningIfActive();');
  });

  it('gates speaking interruption on recognized user words, not raw mic noise', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    expect(source).toContain('SpeechRecognition');
    expect(source).toContain('webkitSpeechRecognition');
    expect(source).toContain('const isIntentionalBargeIn = isIntentionalBargeInTranscript(');
    expect(source).toContain('speakingTextRef.current,');
    expect(source).toContain('cancelAllAudio({ keepBargeInMonitor: true });');
    expect(source).toContain('handleUserTurnRef.current');
    expect(source).toContain('new VoiceBargeInDetector');
    expect(source).toContain('calculateRms(buffer)');
  });

  it('disables barge-in only on the mobile viewport before opening SpeechRecognition', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );
    const helperStart = source.indexOf('function isMobileViewport()');
    const bargeStart = source.indexOf('const startBargeInMonitor = useCallback');
    const bargeBlock = source.slice(bargeStart, source.indexOf('// stopAll', bargeStart));

    expect(helperStart).toBeGreaterThan(-1);
    expect(source).toContain("window.matchMedia('(max-width: 639px)').matches");
    expect(source).not.toContain('(pointer: coarse)');
    expect(bargeBlock.indexOf('if (isMobileViewport()) return;')).toBeGreaterThan(-1);
    expect(bargeBlock.indexOf('if (isMobileViewport()) return;')).toBeLessThan(
      bargeBlock.indexOf('const SpeechRecognitionCtor'),
    );
    expect(bargeBlock).not.toContain('isMobileIntentionalBargeInTranscript');
    expect(source).toContain('recognizer.start();');
  });

  it('uses a desktop mic analyser gate before accepting barge-in transcripts', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );
    const bargeStart = source.indexOf('const startBargeInMonitor = useCallback');
    const bargeBlock = source.slice(bargeStart, source.indexOf('// stopAll', bargeStart));

    expect(source).toContain("import { calculateRms, VoiceBargeInDetector } from './voice-barge-in'");
    expect(source).toContain('const VOICE_BARGE_IN_ANALYSER_FFT_SIZE = 1024');
    expect(source).toContain('const VOICE_BARGE_IN_NEAR_END_WINDOW_MS = 1200');
    expect(source).toContain('const VOICE_BARGE_IN_ANALYSER_SETUP_TIMEOUT_MS = 1200');
    expect(source).toContain('function buildBargeInAudioConstraints()');
    expect(source).toContain("constraints.echoCancellation = 'all'");
    expect(bargeBlock).toContain("let gateMode: 'pending' | 'hybrid' | 'transcript-only' = 'pending'");
    expect(bargeBlock).toContain('const detector = new VoiceBargeInDetector();');
    expect(bargeBlock).toContain('analyser.getByteTimeDomainData(buffer);');
    expect(bargeBlock).toContain('detector.sample({ rms: calculateRms(buffer), nowMs: now })');
    expect(bargeBlock).toContain('nearEndSpeechUntilMs = now + VOICE_BARGE_IN_NEAR_END_WINDOW_MS');
    expect(bargeBlock).toContain('if (!triggered && isIntentionalBargeIn) maybeStartBargeIn(transcript);');
  });

  it('falls back to transcript-only desktop barge-in if analyser setup fails', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );
    const bargeStart = source.indexOf('const startBargeInMonitor = useCallback');
    const bargeBlock = source.slice(bargeStart, source.indexOf('// stopAll', bargeStart));

    expect(bargeBlock).toContain('const enableTranscriptOnlyFallback = () => {');
    expect(bargeBlock).toContain("gateMode = 'transcript-only';");
    expect(bargeBlock).toContain('if (pendingIntentionalTranscript) beginBargeIn(pendingIntentionalTranscript);');
    expect(bargeBlock).toContain('if (!navigator.mediaDevices?.getUserMedia) {');
    expect(bargeBlock).toContain('enableTranscriptOnlyFallback();');
    expect(bargeBlock).toContain('analyserSetupTimer = setTimeout(');
    expect(bargeBlock).toContain('VOICE_BARGE_IN_ANALYSER_SETUP_TIMEOUT_MS');
  });

  it('cleans up desktop barge-in analyser media tracks and animation frames', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );
    const bargeStart = source.indexOf('const startBargeInMonitor = useCallback');
    const bargeBlock = source.slice(bargeStart, source.indexOf('// stopAll', bargeStart));

    expect(bargeBlock).toContain('cancelAnimationFrame(analyserRaf)');
    expect(bargeBlock).toContain('try { analyserCleanup(); } catch {}');
    expect(bargeBlock).toContain('source.disconnect();');
    expect(bargeBlock).toContain('stream.getTracks().forEach((track) => track.stop())');
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
  it('parses AI SDK UI stream text and tool-input chunks for voice dispatch', () => {
    const state: VoiceStreamParseState = { responseText: '', toolCalls: [] };

    parseVoiceStreamLine('data: {"type":"text-delta","delta":"Heading there."}', state);
    parseVoiceStreamLine(
      'data: {"type":"tool-input-available","toolName":"navigate","input":{"page":"portfolio"}}',
      state,
    );
    parseVoiceStreamLine(
      'data: {"type":"tool-input-available","toolName":"startTour","input":{}}',
      state,
    );

    expect(state.responseText).toBe('Heading there.');
    expect(state.toolCalls).toEqual([
      { name: 'navigate', args: { page: 'portfolio' } },
      { name: 'startTour', args: {} },
    ]);
  });

  it('keeps conversational voice rules in the server-side prompt path', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/chat/route.ts'),
      'utf8',
    );

    expect(source).toContain('const voiceResponseInstructions');
    expect(source).toContain('Do not mention or quote these voice instructions');
    expect(source).toContain('Default to conversation');
    expect(source).toContain('do not turn project questions into tours');
    expect(source).toContain('go up to 5 sentences when the context needs it');
    expect(source).toContain('Do not end every response with a follow-up question');
    expect(source).not.toContain('ElevenLabs v3 is the voice engine');
    expect(source).not.toContain('ElevenLabs-style expression');
    expect(source).not.toContain('expression tags sparse');
    expect(source).not.toContain('[curious]');
    expect(source).not.toContain('[dramatically]');
    expect(source).toContain('isVoiceRequest ? voiceResponseInstructions : textChatBoundaryInstructions');
    expect(source).not.toContain('one or two sentences');
  });

  it('keeps site-control tools voice-only on the server', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/chat/route.ts'),
      'utf8',
    );

    expect(source).toContain('const textChatBoundaryInstructions');
    expect(source).toContain('use voice mode for navigation and site-control actions');
    expect(source).toContain('const isVoiceRequest = guarded.body.isVoice === true');
    expect(source).toContain('const toolsEnabled = isVoiceRequest');
    expect(source).toContain('...(toolsEnabled ? { tools: siteControlTools } : {})');
    expect(source).not.toContain('Boolean(isVoice || enableSiteControl)');
    expect(source).not.toContain('const { isVoice, enableSiteControl }');
  });

  it('describes varied multi-stop tours and project-preview scrolling', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/chat/route.ts'),
      'utf8',
    );

    expect(source).toContain('startTour: tool');
    expect(source).toContain('Use only when the user explicitly asks');
    expect(source).toContain('continuous guided showcase until interrupted');
    expect(source).toContain('direct, playful, high-energy, practical');
    expect(source).toContain('Do not manually chain the whole tour');
    expect(source).toContain('Do not explain internal action mechanics');
    expect(source).toContain('automation internals');
    expect(source).toContain('If asked whether you can navigate');
    expect(source).toContain('scrollProjectPreview');
    expect(source).toContain('The user can interrupt the tour');
    expect(source).toContain('similar conversational questions are not tour requests');
  });
});

describe('site-control tool wiring', () => {
  it('wires project-preview scrolling through voice and preview surfaces', () => {
    const route = readFileSync(join(process.cwd(), 'src/app/api/chat/route.ts'), 'utf8');
    const voice = readFileSync(join(process.cwd(), 'src/lib/voice-controller.ts'), 'utf8');
    const provider = readFileSync(join(process.cwd(), 'src/providers/site-control-provider.tsx'), 'utf8');
    const iframeViewer = readFileSync(join(process.cwd(), 'src/components/iframe-viewer.tsx'), 'utf8');
    const githubPreview = readFileSync(join(process.cwd(), 'src/components/github-preview.tsx'), 'utf8');

    expect(route).toContain('scrollProjectPreview: tool');
    expect(voice).toContain("case 'scrollProjectPreview'");
    expect(voice).toContain("runTool('scrollProjectPreview'");
    expect(provider).toContain('scrollProjectPreview: (direction?');
    expect(iframeViewer).toContain('onRegisterPreviewScroller');
    expect(iframeViewer).not.toContain('controlOverlayActive');
    expect(provider).toContain('onRegisterPreviewScroller={registerPreviewScroller}');
    expect(githubPreview).toContain('onRegisterScroller');
    expect(githubPreview).toContain('shell.scrollTo');
  });

  it('keeps Legacy V2 text clients free of site-control dispatch', () => {
    for (const file of ['src/components/chat-popup.tsx', 'src/app/chat/page.tsx']) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');

      expect(source).toContain('useChat({');
      expect(source).toContain('onError: () => {');
      expect(source).not.toContain('enableSiteControl');
      expect(source).not.toContain('DefaultChatTransport');
      expect(source).not.toContain('siteControlChatTransport');
      expect(source).not.toContain('transport:');
      expect(source).not.toContain('useSiteControl');
      expect(source).not.toContain('ToolPart');
      expect(source).not.toContain('getToolCall');
      expect(source).not.toContain('handledToolCallsRef');
      expect(source).not.toContain('toolCall.name');
    }
  });

  it('preserves voice-owned site-control tools and callbacks', () => {
    const route = readFileSync(join(process.cwd(), 'src/app/api/chat/route.ts'), 'utf8');
    const voice = readFileSync(join(process.cwd(), 'src/lib/voice-controller.ts'), 'utf8');
    const sessionProvider = readFileSync(join(process.cwd(), 'src/providers/voice-session-provider.tsx'), 'utf8');

    expect(route).toContain('scrollProjectPreview: tool');
    expect(route).toContain('startTour: tool');
    expect(route).toContain('switchToText: tool');
    expect(route).toContain('endCall: tool');
    expect(voice).toContain('body: JSON.stringify({ messages, isVoice: true })');
    expect(voice).toContain("case 'scrollProjectPreview'");
    expect(voice).toContain("case 'startTour'");
    expect(voice).toContain('startGuidedTour(myTurn)');
    expect(voice).toContain("shouldStartTour = kind === 'user' && isExplicitTourIntent(utterance)");
    expect(voice).toContain("case 'switchToText'");
    expect(voice).toContain("case 'endCall'");
    expect(sessionProvider).toContain('toolCallbacksRef.current.toggleTheme');
    expect(sessionProvider).toContain('toolCallbacksRef.current.openProject');
    expect(sessionProvider).toContain('toolCallbacksRef.current.scrollTo');
    expect(sessionProvider).toContain('toolCallbacksRef.current.scrollProjectPreview');
    expect(sessionProvider).toContain('toolCallbacksRef.current.closeBrowser');
    expect(sessionProvider).toContain('toolCallbacksRef.current.openCurrentProjectExternal');
    expect(sessionProvider).toContain('toolCallbacksRef.current.unsupportedIframeControl');
  });

  it('keeps registered tool callbacks live by mutating the callback ref in place', () => {
    const sessionProvider = readFileSync(join(process.cwd(), 'src/providers/voice-session-provider.tsx'), 'utf8');

    expect(sessionProvider).toContain('Object.assign(toolCallbacksRef.current, callbacks)');
    expect(sessionProvider).not.toContain('toolCallbacksRef.current = { ...toolCallbacksRef.current, ...callbacks }');
  });

  it('guards voice openLink with the approved public URL allowlist', () => {
    const sessionProvider = readFileSync(join(process.cwd(), 'src/providers/voice-session-provider.tsx'), 'utf8');

    expect(sessionProvider).toContain("import { isApprovedExternalLink } from '@/lib/approved-links'");
    expect(sessionProvider).toContain('if (!isApprovedExternalLink(url))');
    expect(sessionProvider).toContain("I can't open that link from voice mode.");
  });

  it('defines the guided tour sequence as an interruptible multi-project showcase', () => {
    const voice = readFileSync(join(process.cwd(), 'src/lib/voice-controller.ts'), 'utf8');
    const tourBlockStart = voice.indexOf('const startGuidedTour = useCallback');
    const tourBlock = voice.slice(tourBlockStart, voice.indexOf('// handleUserTurn', tourBlockStart));

    expect(voice).toContain('tourGenerationRef');
    expect(voice).toContain('waitForTourStep');
    expect(voice).toContain("act('openProject', { slug: 'Review Gate' }");
    expect(voice).toContain("act('scrollProjectPreview', { direction: 'down' }");
    expect(voice).toContain("act('openProject', { slug: 'FSB' }");
    expect(voice).toContain("act('openProject', { slug: 'GitFly' }");
    expect(voice).toContain("act('openProject', { slug: 'Parz-AI' }");
    expect(voice).toContain("act('scrollTo', { selector: 'experience' }");
    expect(tourBlock).not.toContain('faking');
    expect(tourBlock).not.toContain('iframe control');
    expect(tourBlock).not.toContain('steering');
    expect(tourBlock).not.toContain('driving a browser');
    expect(tourBlock).not.toContain('local GitHub surface');
    expect(tourBlock).not.toContain('Play' + 'wright');
    expect(tourBlock).not.toContain('visible AI control');
  });

  it('keeps navigate routed through dispatchToolCall for FSB captions', () => {
    const voice = readFileSync(
      join(process.cwd(), 'src/lib/voice-controller.ts'),
      'utf8',
    );

    expect(voice).toContain("case 'navigate':\n              dispatchToolCall('navigate', tc.args);");
  });

  it('carries the voice capsule rect and panel snapshot into the text chat morph', () => {
    const chatMorph = readFileSync(join(process.cwd(), 'src/lib/chat-morph.ts'), 'utf8');
    const sessionProvider = readFileSync(join(process.cwd(), 'src/providers/voice-session-provider.tsx'), 'utf8');
    const voicePanel = readFileSync(join(process.cwd(), 'src/components/voice-panel.tsx'), 'utf8');
    const chatPopup = readFileSync(join(process.cwd(), 'src/components/chat-popup.tsx'), 'utf8');
    const homePage = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(chatMorph).toContain('export interface ChatMorphRect');
    expect(chatMorph).toContain('export interface ChatVoiceSnapshot');
    expect(sessionProvider).toContain('getCurrentChatMorphOrigin()');
    expect(sessionProvider).toContain("new CustomEvent<OpenTextChatDetail>('parz:open-text-chat'");
    expect(sessionProvider).toContain('voiceSnapshot');
    expect(voicePanel).toContain('[data-chat-morph-origin="true"]');
    expect(voicePanel).toContain('presentation?: boolean');
    expect(chatPopup).toContain('const MORPH_DURATION_MS = 560');
    expect(chatPopup).toContain('const CONTENT_DELAY_MS = MORPH_DURATION_MS');
    expect(chatPopup).toContain("import { getLegacyChatTheme } from '@/lib/chat-theme'");
    expect(chatPopup).toContain('const legacyTheme = getLegacyChatTheme(isDark)');
    expect(chatPopup).toContain('const legacyPanelSurface = legacyTheme.surface');
    expect(chatPopup).toContain("const shellBackground = morphEnabled && !contentReady ? 'var(--color-navbar-bg)' : legacyPanelSurface");
    expect(chatPopup).toContain('Legacy V2 Chat interface (Features may be limited)');
    expect(chatPopup).not.toContain('data-chat-voice-preview="true"');
    expect(chatPopup).toContain('const width = Math.min(400, viewportWidth - 48)');
    expect(homePage).toContain('setChatVoiceSnapshot(detail?.voiceSnapshot)');
    expect(homePage).toContain('setHideNavbarForChatMorph(Boolean(detail?.originRect))');
  });

  it('keeps one FSB badge for page actions and guided tour lifecycle', () => {
    const provider = readFileSync(join(process.cwd(), 'src/providers/site-control-provider.tsx'), 'utf8');
    const iframeViewer = readFileSync(join(process.cwd(), 'src/components/iframe-viewer.tsx'), 'utf8');
    const overlay = readFileSync(join(process.cwd(), 'src/components/fsb-control-overlay.tsx'), 'utf8');

    expect(provider).toContain('const [controlOverlayActive, setControlOverlayActive] = useState(false)');
    expect(provider).toContain('const [tourControlActive, setTourControlActive] = useState(false)');
    expect(provider).toContain('active={controlOverlayActive || tourControlActive}');
    expect(iframeViewer).toContain('onRegisterPreviewScroller');
    expect(iframeViewer).toContain('onRegisterScroller={onRegisterPreviewScroller}');
    expect(overlay).not.toContain('fsb-control-viewport-glow');
    expect(overlay).not.toContain('fsb-control-action-pulse');
  });

  it('keeps the FSB badge mounted for the full guided tour lifecycle', () => {
    const provider = readFileSync(join(process.cwd(), 'src/providers/site-control-provider.tsx'), 'utf8');
    const voice = readFileSync(join(process.cwd(), 'src/lib/voice-controller.ts'), 'utf8');

    expect(provider).toContain('const [tourControlActive, setTourControlActive] = useState(false)');
    expect(provider).toContain("VoiceBus.on('site-control-tour-start'");
    expect(provider).toContain("VoiceBus.on('site-control-tour-end'");
    expect(provider).toContain('active={controlOverlayActive || tourControlActive}');
    expect(voice).toContain("VoiceBus.emit('site-control-tour-start', { tourId })");
    expect(voice).toContain("VoiceBus.emit('site-control-tour-end', { tourId })");
    expect(voice).toContain("VoiceBus.emit('site-control-tour-end', { tourId: stoppedTourId })");
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
    expect(fsbCss).not.toContain('.fsb-control-viewport-glow');
    expect(fsbCss).not.toContain('.fsb-control-action-pulse');
    expect(fsbCss).not.toContain('.fsb-preview-control-overlay');
    expect(fsbCss).not.toContain('--fsb-preview-glow-rgb');
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
