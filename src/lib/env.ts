// Server-side environment variable validation
// Only import this in server components or API routes

/**
 * Validates that required server-side environment variables are present.
 * Returns the validated values or throws with a descriptive error.
 */
export function getServerEnv() {
  const xaiApiKey = process.env.XAI_API_KEY;

  if (!xaiApiKey) {
    throw new Error(
      'Missing required environment variable: XAI_API_KEY. ' +
      'Set it in .env.local for development or in the Amplify Console for production.'
    );
  }

  return {
    XAI_API_KEY: xaiApiKey,
  };
}

/**
 * Checks if a specific environment variable is configured.
 * Useful for conditional feature enablement without throwing.
 */
export function hasEnvVar(name: string): boolean {
  return typeof process.env[name] === 'string' && process.env[name]!.length > 0;
}
