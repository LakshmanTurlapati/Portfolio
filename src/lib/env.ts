// Server-side environment variable validation
// Only import this in server components or API routes

/**
 * Checks if a specific environment variable is configured.
 * Useful for conditional feature enablement without throwing.
 */
export function hasEnvVar(name: string): boolean {
  return typeof process.env[name] === 'string' && process.env[name]!.length > 0;
}

function decodePem(name: string, label: 'PRIVATE KEY' | 'PUBLIC KEY'): string {
  const encoded = process.env[name];
  if (!encoded) throw new Error(`Missing required environment variable: ${name}.`);

  if (
    encoded.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)
  ) {
    throw new Error(`${name} is not valid base64.`);
  }

  let pem: string;
  try {
    pem = Buffer.from(encoded, 'base64').toString('utf8').trim();
  } catch {
    throw new Error(`${name} is not valid base64.`);
  }

  if (
    !pem.startsWith(`-----BEGIN ${label}-----`) ||
    !pem.endsWith(`-----END ${label}-----`) ||
    pem.includes('\0')
  ) {
    throw new Error(`${name} does not contain a valid ${label} PEM value.`);
  }
  return `${pem}\n`;
}

export function getConciergeSigningEnv(): {
  privateKeyPem: string;
  publicKeyPem: string;
} {
  return {
    privateKeyPem: decodePem('CONCIERGE_ES256_PRIVATE_KEY_PEM_B64', 'PRIVATE KEY'),
    publicKeyPem: decodePem('CONCIERGE_ES256_PUBLIC_KEY_PEM_B64', 'PUBLIC KEY'),
  };
}
