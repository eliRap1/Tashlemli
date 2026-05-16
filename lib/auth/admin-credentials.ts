export const ADMIN_COOKIE = "tshl_ops";

const MIN_SECRET_LENGTH = 16;

function configuredSecret(value: string | undefined): string | null {
  return value && value.length >= MIN_SECRET_LENGTH ? value : null;
}

function secureEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function hasValidAdminPassword(input: string | null | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  const expected = configuredSecret(env.OPS_PASSWORD);
  return Boolean(expected && input && secureEqual(input, expected));
}

export function hasValidAdminCookie(input: string | null | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  const expected = configuredSecret(env.OPS_COOKIE);
  return Boolean(expected && input && secureEqual(input, expected));
}

export function getAdminCookieSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  return configuredSecret(env.OPS_COOKIE);
}
