export const SESSION_COOKIE = "internori_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "";
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bytesToHex(signature);
}

export function authConfigured(): boolean {
  return Boolean(
    process.env.AUTH_USERNAME &&
      process.env.AUTH_PASSWORD &&
      process.env.AUTH_SECRET,
  );
}

export function validateCredentials(username: string, password: string): boolean {
  if (!authConfigured()) return false;

  return (
    username === process.env.AUTH_USERNAME && password === process.env.AUTH_PASSWORD
  );
}

const SIG_HEX_LENGTH = 64; // SHA-256 en hex

export async function createSessionToken(username: string): Promise<string> {
  const sig = await hmacHex(username, getSecret());
  // Separador fijo al final: el email puede contener "." (gmail.com)
  return `${encodeURIComponent(username)}.${sig}`;
}

export async function verifySessionCookie(value: string | undefined): Promise<string | null> {
  if (!value || !getSecret()) return null;

  if (value.length <= SIG_HEX_LENGTH + 1) return null;

  const sig = value.slice(-SIG_HEX_LENGTH);
  const encodedUser = value.slice(0, -(SIG_HEX_LENGTH + 1));
  if (!encodedUser || value.charAt(encodedUser.length) !== ".") return null;

  const username = decodeURIComponent(encodedUser);

  const expected = await hmacHex(username, getSecret());
  if (!timingSafeEqualHex(sig, expected)) return null;
  if (username !== process.env.AUTH_USERNAME) return null;

  return username;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
