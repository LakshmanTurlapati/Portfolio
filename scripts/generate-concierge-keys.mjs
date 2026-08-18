#!/usr/bin/env node

import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const encode = (pem) => Buffer.from(pem, 'utf8').toString('base64');

process.stdout.write(
  `CONCIERGE_ES256_PRIVATE_KEY_PEM_B64=${encode(privateKey)}\n` +
    `CONCIERGE_ES256_PUBLIC_KEY_PEM_B64=${encode(publicKey)}\n`,
);
