#!/usr/bin/env node

import { resolve4 } from 'node:dns/promises';
import { writeFile } from 'node:fs/promises';

const rawBaseUrl = process.env.PRODUCTION_BASE_URL;

if (!rawBaseUrl) {
  console.error('PRODUCTION_BASE_URL is required, e.g. https://audienclature.com');
  process.exit(2);
}

const baseUrl = rawBaseUrl.replace(/\/+$/, '');
let parsedUrl;

try {
  parsedUrl = new URL(baseUrl);
} catch {
  console.error('PRODUCTION_BASE_URL must be a valid URL');
  process.exit(2);
}

if (parsedUrl.protocol !== 'https:') {
  console.error('PRODUCTION_BASE_URL must use https');
  process.exit(2);
}

if (baseUrl === 'https://portfolio-v4-test.fly.dev' || parsedUrl.hostname === 'portfolio-v4-test.fly.dev') {
  console.error('Fly substitute is not valid for Phase 15 gap closure; use the Amplify production URL');
  process.exit(2);
}

function contentType(response) {
  return response.headers.get('content-type') ?? '';
}

function logRoute(routeName, status, type, marker, passed, extra = '') {
  const suffix = extra ? ` ${extra}` : '';
  console.log(`${routeName} http_status ${status} content_type ${JSON.stringify(type)} ${marker} ${passed}${suffix}`);

  if (status === 503) {
    console.log(`route returned 503 ${routeName}`);
  }
}

function looksTokenLike(value) {
  return typeof value === 'string' && value.length >= 20 && /^[A-Za-z0-9._-]+$/.test(value);
}

function hasMp3Signature(buffer) {
  if (buffer.length < 3) return false;

  const hasId3Header = buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33;
  const hasMpegSync = buffer[0] === 0xff && [0xfb, 0xf3, 0xf2].includes(buffer[1]);

  return hasId3Header || hasMpegSync;
}

async function verifyDns() {
  try {
    const addresses = await resolve4(parsedUrl.hostname);
    console.log(`dns_resolved true hostname ${parsedUrl.hostname} address_count ${addresses.length}`);
    return true;
  } catch (error) {
    console.log(`dns_resolved false hostname ${parsedUrl.hostname} error ${error.code ?? 'DNS_ERROR'}`);
    return false;
  }
}

async function testTextChat() {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          parts: [{ type: 'text', text: 'Say hello in one short sentence.' }],
          id: 'gap-text-1',
        },
      ],
      isVoice: false,
    }),
  });

  const type = contentType(response);
  const text = await response.text();
  const passed = response.status === 200
    && type.includes('text/event-stream')
    && text.includes('data:')
    && !text.includes('Chat service is not configured')
    && !text.includes('"error"');

  logRoute('/api/chat text', response.status, type, 'chat_text_stream', passed);
  return passed;
}

async function testVoiceChat() {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          parts: [{ type: 'text', text: 'Navigate to the portfolio and say one sentence.' }],
          id: 'gap-voice-1',
        },
      ],
      isVoice: true,
    }),
  });

  const type = contentType(response);
  const text = await response.text();
  const passed = response.status === 200
    && type.includes('text/event-stream')
    && text.includes('data:')
    && !text.includes('Chat service is not configured')
    && !text.includes('"error"');

  logRoute('/api/chat voice', response.status, type, 'chat_voice_stream', passed);
  return passed;
}

async function testSttToken() {
  const response = await fetch(`${baseUrl}/api/stt-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
  });

  const type = contentType(response);
  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  const topLevelValues = body && typeof body === 'object' && !Array.isArray(body)
    ? Object.values(body)
    : [];
  const tokenPresent = response.status === 200
    && Boolean(body)
    && (looksTokenLike(body.token) || topLevelValues.some(looksTokenLike));

  logRoute('/api/stt-token', response.status, type, 'stt_token_present', tokenPresent);
  return tokenPresent;
}

async function testTts() {
  const response = await fetch(`${baseUrl}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({
      text: 'Hello from Parz production verification',
      voiceId: 'dMWVPH9DSxWOMrrrUso3',
    }),
  });

  const type = contentType(response);
  const buffer = Buffer.from(await response.arrayBuffer());

  if (response.status === 200) {
    await writeFile('/tmp/parz-amplify-gap-test.mp3', buffer);
  }

  const passed = response.status === 200
    && type.includes('audio/mpeg')
    && buffer.length > 1000
    && hasMp3Signature(buffer);

  logRoute('/api/tts', response.status, type, 'tts_mp3_signature', passed, `bytes ${buffer.length}`);
  return passed;
}

async function main() {
  const dnsOk = await verifyDns();

  if (!dnsOk) {
    process.exit(1);
  }

  try {
    const results = [
      await testTextChat(),
      await testVoiceChat(),
      await testSttToken(),
      await testTts(),
    ];

    process.exit(results.every(Boolean) ? 0 : 1);
  } catch (error) {
    console.error(`request_failed ${error.name ?? 'Error'} ${error.message ?? 'Unknown failure'}`);
    process.exit(1);
  }
}

await main();
